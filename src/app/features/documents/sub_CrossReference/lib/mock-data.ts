// Mock data for cross-reference graph visualization

import type {
  CrossRefNode,
  CrossRefLink,
  CrossRefGraphData,
  GraphStats,
  ImpactAnalysis,
  CrossRefNodeType,
  CrossRefLinkType,
} from './types';

/**
 * Generate a unique ID
 */
function generateId(): string {
  return `cr-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Mock nodes representing defined terms, clauses, covenants, etc.
 */
export const mockNodes: CrossRefNode[] = [
  // Key Definitions
  {
    id: 'def-ebitda',
    name: 'EBITDA',
    type: 'definition',
    category: 'definitions',
    content: '"EBITDA" means, for any period, Consolidated Net Income for such period plus (a) the sum of...',
    location: { section: '1.01', page: 5, clauseRef: 'Definition - EBITDA' },
    currentValue: 'Consolidated Net Income + Interest Expense + Taxes + D&A',
    previousValue: 'Consolidated Net Income + Interest Expense + Taxes + D&A - Extraordinary Items',
    isModified: true,
    incomingCount: 0,
    outgoingCount: 8,
    impactSeverity: 'critical',
    impactedNodeIds: ['cov-leverage', 'cov-interest', 'cov-fixed-charge', 'pricing-margin', 'cov-debt-service', 'cov-capex', 'rep-financial', 'event-covenant-breach'],
  },
  {
    id: 'def-consolidated-debt',
    name: 'Consolidated Total Debt',
    type: 'definition',
    category: 'definitions',
    content: '"Consolidated Total Debt" means, as of any date of determination, the aggregate principal amount of all Indebtedness...',
    location: { section: '1.01', page: 6, clauseRef: 'Definition - Consolidated Total Debt' },
    currentValue: 'All Indebtedness less Unrestricted Cash up to $25M',
    isModified: false,
    incomingCount: 0,
    outgoingCount: 3,
    impactSeverity: 'high',
    impactedNodeIds: ['cov-leverage', 'cov-debt-incurrence', 'pricing-margin'],
  },
  {
    id: 'def-material-adverse-effect',
    name: 'Material Adverse Effect',
    type: 'definition',
    category: 'definitions',
    content: '"Material Adverse Effect" means any event, circumstance or condition that has had or could reasonably be expected to have...',
    location: { section: '1.01', page: 8, clauseRef: 'Definition - Material Adverse Effect' },
    currentValue: 'Event causing >$10M impact or material impairment',
    previousValue: 'Event causing >$5M impact or material impairment',
    isModified: true,
    incomingCount: 0,
    outgoingCount: 5,
    impactSeverity: 'high',
    impactedNodeIds: ['rep-no-mae', 'cond-no-mae', 'event-mae', 'clause-bringdown', 'rep-litigation'],
  },
  {
    id: 'def-permitted-indebtedness',
    name: 'Permitted Indebtedness',
    type: 'definition',
    category: 'definitions',
    content: '"Permitted Indebtedness" means Indebtedness incurred in the ordinary course of business...',
    location: { section: '1.01', page: 12, clauseRef: 'Definition - Permitted Indebtedness' },
    currentValue: 'Up to $15M for equipment financing',
    isModified: false,
    incomingCount: 0,
    outgoingCount: 2,
    impactSeverity: 'medium',
    impactedNodeIds: ['cov-debt-incurrence', 'rep-indebtedness'],
  },
  {
    id: 'def-change-of-control',
    name: 'Change of Control',
    type: 'definition',
    category: 'definitions',
    content: '"Change of Control" means the occurrence of any of the following: (a) any person or group acquires beneficial ownership of 35% or more...',
    location: { section: '1.01', page: 10, clauseRef: 'Definition - Change of Control' },
    currentValue: '35% ownership threshold',
    previousValue: '30% ownership threshold',
    isModified: true,
    incomingCount: 0,
    outgoingCount: 3,
    impactSeverity: 'critical',
    impactedNodeIds: ['event-coc', 'clause-mandatory-prepay', 'cond-no-coc'],
  },

  // Financial Covenants
  {
    id: 'cov-leverage',
    name: 'Maximum Leverage Ratio',
    type: 'covenant',
    category: 'covenants',
    content: 'The Borrower shall not permit the Leverage Ratio as of the last day of any fiscal quarter to exceed 4.50:1.00.',
    location: { section: '7.11(a)', page: 45, clauseRef: 'Section 7.11(a) - Leverage Ratio' },
    currentValue: '4.50:1.00',
    previousValue: '4.00:1.00',
    isModified: true,
    incomingCount: 2,
    outgoingCount: 2,
    impactSeverity: 'critical',
    impactedNodeIds: ['pricing-margin', 'event-covenant-breach'],
  },
  {
    id: 'cov-interest',
    name: 'Minimum Interest Coverage',
    type: 'covenant',
    category: 'covenants',
    content: 'The Borrower shall not permit the Interest Coverage Ratio as of the last day of any fiscal quarter to be less than 3.00:1.00.',
    location: { section: '7.11(b)', page: 45, clauseRef: 'Section 7.11(b) - Interest Coverage' },
    currentValue: '3.00:1.00',
    isModified: false,
    incomingCount: 1,
    outgoingCount: 1,
    impactSeverity: 'high',
    impactedNodeIds: ['event-covenant-breach'],
  },
  {
    id: 'cov-fixed-charge',
    name: 'Fixed Charge Coverage Ratio',
    type: 'covenant',
    category: 'covenants',
    content: 'The Borrower shall maintain a Fixed Charge Coverage Ratio of not less than 1.25:1.00.',
    location: { section: '7.11(c)', page: 46, clauseRef: 'Section 7.11(c) - Fixed Charge Coverage' },
    currentValue: '1.25:1.00',
    isModified: false,
    incomingCount: 1,
    outgoingCount: 1,
    impactSeverity: 'medium',
    impactedNodeIds: ['event-covenant-breach'],
  },
  {
    id: 'cov-debt-incurrence',
    name: 'Debt Incurrence Limitation',
    type: 'covenant',
    category: 'covenants',
    content: 'The Borrower shall not incur any Indebtedness other than Permitted Indebtedness.',
    location: { section: '7.02', page: 42, clauseRef: 'Section 7.02 - Indebtedness' },
    currentValue: 'Permitted Indebtedness only',
    isModified: false,
    incomingCount: 2,
    outgoingCount: 1,
    impactSeverity: 'medium',
    impactedNodeIds: ['event-covenant-breach'],
  },
  {
    id: 'cov-debt-service',
    name: 'Debt Service Coverage',
    type: 'covenant',
    category: 'covenants',
    content: 'The Borrower shall maintain a Debt Service Coverage Ratio of not less than 1.10:1.00.',
    location: { section: '7.11(d)', page: 46, clauseRef: 'Section 7.11(d) - DSCR' },
    currentValue: '1.10:1.00',
    isModified: false,
    incomingCount: 1,
    outgoingCount: 1,
    impactSeverity: 'medium',
    impactedNodeIds: ['event-covenant-breach'],
  },
  {
    id: 'cov-capex',
    name: 'Capital Expenditure Limitation',
    type: 'covenant',
    category: 'covenants',
    content: 'The Borrower shall not make Capital Expenditures in any fiscal year exceeding $50,000,000.',
    location: { section: '7.08', page: 44, clauseRef: 'Section 7.08 - Capital Expenditures' },
    currentValue: '$50,000,000 per fiscal year',
    previousValue: '$40,000,000 per fiscal year',
    isModified: true,
    incomingCount: 1,
    outgoingCount: 1,
    impactSeverity: 'low',
    impactedNodeIds: ['event-covenant-breach'],
  },

  // Pricing Grid
  {
    id: 'pricing-margin',
    name: 'Applicable Margin',
    type: 'pricing',
    category: 'financial_terms',
    content: 'The Applicable Margin shall be determined based on the Leverage Ratio as set forth in the pricing grid.',
    location: { section: '2.05', page: 20, clauseRef: 'Section 2.05 - Interest Rate' },
    currentValue: 'SOFR + 2.75% (at current leverage)',
    previousValue: 'LIBOR + 2.50% (at current leverage)',
    isModified: true,
    incomingCount: 2,
    outgoingCount: 0,
    impactSeverity: 'none',
    impactedNodeIds: [],
  },
  {
    id: 'pricing-commitment-fee',
    name: 'Commitment Fee',
    type: 'pricing',
    category: 'financial_terms',
    content: 'The Borrower shall pay a commitment fee on the average daily unused portion of the Commitments.',
    location: { section: '2.09', page: 22, clauseRef: 'Section 2.09 - Fees' },
    currentValue: '0.50% per annum',
    isModified: false,
    incomingCount: 1,
    outgoingCount: 0,
    impactSeverity: 'none',
    impactedNodeIds: [],
  },

  // Representations & Warranties
  {
    id: 'rep-financial',
    name: 'Financial Statements Rep',
    type: 'representation',
    category: 'representations',
    content: 'The financial statements delivered to the Lenders fairly present in all material respects the financial condition of the Borrower.',
    location: { section: '5.05', page: 30, clauseRef: 'Section 5.05 - Financial Statements' },
    currentValue: 'GAAP compliant, no material misstatement',
    isModified: false,
    incomingCount: 1,
    outgoingCount: 1,
    impactSeverity: 'medium',
    impactedNodeIds: ['clause-bringdown'],
  },
  {
    id: 'rep-no-mae',
    name: 'No Material Adverse Effect',
    type: 'representation',
    category: 'representations',
    content: 'Since the date of the last audited financial statements, there has been no Material Adverse Effect.',
    location: { section: '5.06', page: 31, clauseRef: 'Section 5.06 - No MAE' },
    currentValue: 'No MAE since last audit',
    isModified: false,
    incomingCount: 1,
    outgoingCount: 1,
    impactSeverity: 'high',
    impactedNodeIds: ['clause-bringdown'],
  },
  {
    id: 'rep-litigation',
    name: 'Litigation Rep',
    type: 'representation',
    category: 'representations',
    content: 'There is no pending or threatened litigation that could reasonably be expected to have a Material Adverse Effect.',
    location: { section: '5.08', page: 32, clauseRef: 'Section 5.08 - Litigation' },
    currentValue: 'No material litigation',
    isModified: false,
    incomingCount: 1,
    outgoingCount: 1,
    impactSeverity: 'medium',
    impactedNodeIds: ['clause-bringdown'],
  },
  {
    id: 'rep-indebtedness',
    name: 'Indebtedness Rep',
    type: 'representation',
    category: 'representations',
    content: 'Schedule 5.11 sets forth all Indebtedness of the Borrower as of the Closing Date.',
    location: { section: '5.11', page: 33, clauseRef: 'Section 5.11 - Indebtedness' },
    currentValue: 'Per Schedule 5.11',
    isModified: false,
    incomingCount: 1,
    outgoingCount: 0,
    impactSeverity: 'low',
    impactedNodeIds: [],
  },

  // Conditions Precedent
  {
    id: 'cond-no-mae',
    name: 'No MAE Condition',
    type: 'condition',
    category: 'conditions',
    content: 'No Material Adverse Effect shall have occurred since the date of this Agreement.',
    location: { section: '4.02(c)', page: 25, clauseRef: 'Section 4.02(c) - Conditions' },
    currentValue: 'Required for each borrowing',
    isModified: false,
    incomingCount: 1,
    outgoingCount: 0,
    impactSeverity: 'none',
    impactedNodeIds: [],
  },
  {
    id: 'cond-no-coc',
    name: 'No Change of Control',
    type: 'condition',
    category: 'conditions',
    content: 'No Change of Control shall have occurred.',
    location: { section: '4.02(d)', page: 25, clauseRef: 'Section 4.02(d) - Conditions' },
    currentValue: 'Required for each borrowing',
    isModified: false,
    incomingCount: 1,
    outgoingCount: 0,
    impactSeverity: 'none',
    impactedNodeIds: [],
  },

  // Events of Default
  {
    id: 'event-covenant-breach',
    name: 'Covenant Breach',
    type: 'event',
    category: 'events_default',
    content: 'The Borrower shall fail to observe or perform any covenant contained in Section 7 of this Agreement.',
    location: { section: '8.01(d)', page: 55, clauseRef: 'Section 8.01(d) - Events of Default' },
    currentValue: '30-day cure period for non-financial covenants',
    isModified: false,
    incomingCount: 6,
    outgoingCount: 1,
    impactSeverity: 'critical',
    impactedNodeIds: ['clause-acceleration'],
  },
  {
    id: 'event-mae',
    name: 'MAE Event',
    type: 'event',
    category: 'events_default',
    content: 'A Material Adverse Effect shall occur.',
    location: { section: '8.01(h)', page: 56, clauseRef: 'Section 8.01(h) - Events of Default' },
    currentValue: 'No cure period',
    isModified: false,
    incomingCount: 1,
    outgoingCount: 1,
    impactSeverity: 'critical',
    impactedNodeIds: ['clause-acceleration'],
  },
  {
    id: 'event-coc',
    name: 'Change of Control Event',
    type: 'event',
    category: 'events_default',
    content: 'A Change of Control shall occur.',
    location: { section: '8.01(i)', page: 56, clauseRef: 'Section 8.01(i) - Events of Default' },
    currentValue: 'Immediate event of default',
    isModified: false,
    incomingCount: 1,
    outgoingCount: 1,
    impactSeverity: 'critical',
    impactedNodeIds: ['clause-acceleration'],
  },

  // Clauses
  {
    id: 'clause-bringdown',
    name: 'Bring-Down Certificate',
    type: 'clause',
    category: 'miscellaneous',
    content: 'Representations and warranties made as of the Closing Date and each borrowing date.',
    location: { section: '4.02(a)', page: 24, clauseRef: 'Section 4.02(a) - Bringdown' },
    currentValue: 'Required for each borrowing',
    isModified: false,
    incomingCount: 4,
    outgoingCount: 0,
    impactSeverity: 'none',
    impactedNodeIds: [],
  },
  {
    id: 'clause-mandatory-prepay',
    name: 'Mandatory Prepayment',
    type: 'clause',
    category: 'miscellaneous',
    content: 'Upon a Change of Control, the Borrower shall prepay all outstanding Loans in full.',
    location: { section: '2.11(b)', page: 23, clauseRef: 'Section 2.11(b) - Mandatory Prepayment' },
    currentValue: '100% of outstanding loans',
    isModified: false,
    incomingCount: 1,
    outgoingCount: 0,
    impactSeverity: 'none',
    impactedNodeIds: [],
  },
  {
    id: 'clause-acceleration',
    name: 'Acceleration',
    type: 'clause',
    category: 'miscellaneous',
    content: 'Upon an Event of Default, the Administrative Agent may declare all Obligations immediately due and payable.',
    location: { section: '8.02', page: 57, clauseRef: 'Section 8.02 - Remedies' },
    currentValue: 'At Lender discretion',
    isModified: false,
    incomingCount: 3,
    outgoingCount: 0,
    impactSeverity: 'none',
    impactedNodeIds: [],
  },
];

/**
 * Mock links between nodes
 */
export const mockLinks: CrossRefLink[] = [
  // EBITDA definition impacts
  { id: 'link-1', sourceId: 'def-ebitda', targetId: 'cov-leverage', type: 'defines', strength: 1.0, description: 'EBITDA is the numerator in Leverage Ratio calculation', isModified: true },
  { id: 'link-2', sourceId: 'def-ebitda', targetId: 'cov-interest', type: 'defines', strength: 1.0, description: 'EBITDA is the numerator in Interest Coverage calculation', isModified: true },
  { id: 'link-3', sourceId: 'def-ebitda', targetId: 'cov-fixed-charge', type: 'defines', strength: 1.0, description: 'EBITDA is used in Fixed Charge Coverage calculation', isModified: true },
  { id: 'link-4', sourceId: 'def-ebitda', targetId: 'cov-debt-service', type: 'defines', strength: 0.9, description: 'EBITDA influences DSCR calculation', isModified: true },
  { id: 'link-5', sourceId: 'def-ebitda', targetId: 'cov-capex', type: 'references', strength: 0.5, description: 'CapEx limitation references EBITDA-based basket', isModified: false },
  { id: 'link-6', sourceId: 'def-ebitda', targetId: 'rep-financial', type: 'references', strength: 0.6, description: 'Financial statements rep covers EBITDA calculations', isModified: false },
  { id: 'link-7', sourceId: 'def-ebitda', targetId: 'pricing-margin', type: 'depends_on', strength: 0.8, description: 'Pricing grid depends on leverage which uses EBITDA', isModified: true },
  { id: 'link-8', sourceId: 'def-ebitda', targetId: 'event-covenant-breach', type: 'triggers', strength: 0.7, description: 'EBITDA miscalculation could trigger covenant breach', isModified: false },

  // Consolidated Debt impacts
  { id: 'link-9', sourceId: 'def-consolidated-debt', targetId: 'cov-leverage', type: 'defines', strength: 1.0, description: 'Debt is the denominator in Leverage Ratio', isModified: false },
  { id: 'link-10', sourceId: 'def-consolidated-debt', targetId: 'cov-debt-incurrence', type: 'references', strength: 0.8, description: 'Debt incurrence covenant uses Consolidated Debt definition', isModified: false },
  { id: 'link-11', sourceId: 'def-consolidated-debt', targetId: 'pricing-margin', type: 'depends_on', strength: 0.7, description: 'Pricing depends on leverage which uses Debt', isModified: false },

  // Material Adverse Effect impacts
  { id: 'link-12', sourceId: 'def-material-adverse-effect', targetId: 'rep-no-mae', type: 'defines', strength: 1.0, description: 'MAE definition used in No MAE representation', isModified: true },
  { id: 'link-13', sourceId: 'def-material-adverse-effect', targetId: 'cond-no-mae', type: 'defines', strength: 1.0, description: 'MAE definition used in conditions precedent', isModified: true },
  { id: 'link-14', sourceId: 'def-material-adverse-effect', targetId: 'event-mae', type: 'defines', strength: 1.0, description: 'MAE definition triggers MAE event of default', isModified: true },
  { id: 'link-15', sourceId: 'def-material-adverse-effect', targetId: 'clause-bringdown', type: 'references', strength: 0.8, description: 'Bringdown certificate requires no MAE', isModified: false },
  { id: 'link-16', sourceId: 'def-material-adverse-effect', targetId: 'rep-litigation', type: 'references', strength: 0.7, description: 'Litigation rep uses MAE threshold', isModified: false },

  // Permitted Indebtedness impacts
  { id: 'link-17', sourceId: 'def-permitted-indebtedness', targetId: 'cov-debt-incurrence', type: 'defines', strength: 1.0, description: 'Permitted Indebtedness carves out from incurrence covenant', isModified: false },
  { id: 'link-18', sourceId: 'def-permitted-indebtedness', targetId: 'rep-indebtedness', type: 'references', strength: 0.6, description: 'Indebtedness rep references permitted categories', isModified: false },

  // Change of Control impacts
  { id: 'link-19', sourceId: 'def-change-of-control', targetId: 'event-coc', type: 'defines', strength: 1.0, description: 'CoC definition triggers CoC event of default', isModified: true },
  { id: 'link-20', sourceId: 'def-change-of-control', targetId: 'clause-mandatory-prepay', type: 'triggers', strength: 1.0, description: 'CoC triggers mandatory prepayment', isModified: true },
  { id: 'link-21', sourceId: 'def-change-of-control', targetId: 'cond-no-coc', type: 'defines', strength: 0.9, description: 'CoC definition used in conditions precedent', isModified: true },

  // Leverage Ratio cascade
  { id: 'link-22', sourceId: 'cov-leverage', targetId: 'pricing-margin', type: 'depends_on', strength: 1.0, description: 'Pricing margin steps up/down based on leverage ratio', isModified: true },
  { id: 'link-23', sourceId: 'cov-leverage', targetId: 'event-covenant-breach', type: 'triggers', strength: 1.0, description: 'Leverage breach triggers event of default', isModified: false },

  // Other covenant triggers
  { id: 'link-24', sourceId: 'cov-interest', targetId: 'event-covenant-breach', type: 'triggers', strength: 1.0, description: 'Interest coverage breach triggers default', isModified: false },
  { id: 'link-25', sourceId: 'cov-fixed-charge', targetId: 'event-covenant-breach', type: 'triggers', strength: 1.0, description: 'FCCR breach triggers default', isModified: false },
  { id: 'link-26', sourceId: 'cov-debt-service', targetId: 'event-covenant-breach', type: 'triggers', strength: 1.0, description: 'DSCR breach triggers default', isModified: false },
  { id: 'link-27', sourceId: 'cov-debt-incurrence', targetId: 'event-covenant-breach', type: 'triggers', strength: 0.9, description: 'Unauthorized debt triggers default', isModified: false },
  { id: 'link-28', sourceId: 'cov-capex', targetId: 'event-covenant-breach', type: 'triggers', strength: 0.8, description: 'CapEx breach triggers default', isModified: false },

  // Representation bringdown
  { id: 'link-29', sourceId: 'rep-financial', targetId: 'clause-bringdown', type: 'references', strength: 0.9, description: 'Financial statements rep brought down at each borrowing', isModified: false },
  { id: 'link-30', sourceId: 'rep-no-mae', targetId: 'clause-bringdown', type: 'references', strength: 1.0, description: 'No MAE rep brought down at each borrowing', isModified: false },
  { id: 'link-31', sourceId: 'rep-litigation', targetId: 'clause-bringdown', type: 'references', strength: 0.8, description: 'Litigation rep brought down at each borrowing', isModified: false },

  // Events of default to acceleration
  { id: 'link-32', sourceId: 'event-covenant-breach', targetId: 'clause-acceleration', type: 'triggers', strength: 1.0, description: 'Covenant breach enables acceleration', isModified: false },
  { id: 'link-33', sourceId: 'event-mae', targetId: 'clause-acceleration', type: 'triggers', strength: 1.0, description: 'MAE event enables acceleration', isModified: false },
  { id: 'link-34', sourceId: 'event-coc', targetId: 'clause-acceleration', type: 'triggers', strength: 1.0, description: 'CoC event enables acceleration', isModified: false },

  // Pricing dependencies
  { id: 'link-35', sourceId: 'cov-leverage', targetId: 'pricing-commitment-fee', type: 'depends_on', strength: 0.6, description: 'Commitment fee may step with leverage', isModified: false },
];

/**
 * Calculate graph statistics
 */
function calculateStats(nodes: CrossRefNode[], links: CrossRefLink[]): GraphStats {
  const nodesByType: Record<CrossRefNodeType, number> = {
    definition: 0,
    clause: 0,
    covenant: 0,
    pricing: 0,
    representation: 0,
    condition: 0,
    event: 0,
  };

  const linksByType: Record<CrossRefLinkType, number> = {
    defines: 0,
    references: 0,
    depends_on: 0,
    triggers: 0,
    constrains: 0,
    modifies: 0,
  };

  nodes.forEach(node => {
    nodesByType[node.type]++;
  });

  links.forEach(link => {
    linksByType[link.type]++;
  });

  const modifiedNodes = nodes.filter(n => n.isModified).length;
  const highImpactNodes = nodes.filter(n => n.impactSeverity === 'high' || n.impactSeverity === 'critical').length;

  const totalConnections = nodes.reduce((sum, n) => sum + n.incomingCount + n.outgoingCount, 0);
  const avgConnections = nodes.length > 0 ? totalConnections / nodes.length : 0;

  const mostConnected = nodes.reduce((max, node) => {
    const connections = node.incomingCount + node.outgoingCount;
    if (!max || connections > max.connections) {
      return { id: node.id, name: node.name, connections };
    }
    return max;
  }, null as { id: string; name: string; connections: number } | null);

  return {
    totalNodes: nodes.length,
    nodesByType,
    totalLinks: links.length,
    linksByType,
    modifiedNodes,
    highImpactNodes,
    avgConnections,
    mostConnectedNode: mostConnected,
  };
}

/**
 * Mock graph data for document comparison
 */
export const mockGraphData: CrossRefGraphData = {
  documentId: 'doc-1',
  documentName: 'Apollo Credit Fund Facility Agreement',
  comparisonDocumentId: 'doc-2',
  comparisonDocumentName: 'Apollo Credit Fund First Amendment',
  nodes: mockNodes,
  links: mockLinks,
  stats: calculateStats(mockNodes, mockLinks),
  generatedAt: new Date().toISOString(),
};

/**
 * Generate mock impact analysis for a node
 */
export function generateMockImpactAnalysis(nodeId: string): ImpactAnalysis {
  const sourceNode = mockNodes.find(n => n.id === nodeId);
  if (!sourceNode) {
    return {
      sourceNodeId: nodeId,
      directImpacts: [],
      cascadingImpacts: [],
      totalImpactScore: 0,
      summary: 'Node not found',
      recommendations: [],
    };
  }

  // Find direct impacts (first-degree connections)
  const directLinks = mockLinks.filter(l => l.sourceId === nodeId);
  const directImpacts = directLinks.map(link => {
    const targetNode = mockNodes.find(n => n.id === link.targetId);
    return {
      nodeId: link.targetId,
      nodeName: targetNode?.name || 'Unknown',
      impactType: link.type,
      severity: targetNode?.impactSeverity || 'low',
      description: link.description,
    };
  });

  // Find cascading impacts (second-degree and beyond)
  const visitedIds = new Set<string>([nodeId, ...directLinks.map(l => l.targetId)]);
  const cascadingImpacts: ImpactAnalysis['cascadingImpacts'] = [];

  const queue: { nodeId: string; path: string[]; depth: number }[] = directLinks.map(l => ({
    nodeId: l.targetId,
    path: [sourceNode.name],
    depth: 1,
  }));

  while (queue.length > 0) {
    const current = queue.shift()!;
    const currentNode = mockNodes.find(n => n.id === current.nodeId);
    if (!currentNode) continue;

    const nextLinks = mockLinks.filter(l => l.sourceId === current.nodeId);
    for (const link of nextLinks) {
      if (!visitedIds.has(link.targetId)) {
        visitedIds.add(link.targetId);
        const targetNode = mockNodes.find(n => n.id === link.targetId);
        if (targetNode) {
          const newPath = [...current.path, currentNode.name];
          cascadingImpacts.push({
            nodeId: link.targetId,
            nodeName: targetNode.name,
            pathFromSource: newPath,
            depth: current.depth + 1,
            severity: targetNode.impactSeverity,
            description: `${link.description} (via ${newPath.join(' -> ')})`,
          });

          if (current.depth < 3) {
            queue.push({
              nodeId: link.targetId,
              path: newPath,
              depth: current.depth + 1,
            });
          }
        }
      }
    }
  }

  // Calculate total impact score
  const severityScores = { none: 0, low: 10, medium: 25, high: 50, critical: 100 };
  const directScore = directImpacts.reduce((sum, i) => sum + severityScores[i.severity], 0);
  const cascadingScore = cascadingImpacts.reduce((sum, i) => sum + severityScores[i.severity] / i.depth, 0);
  const totalScore = Math.min(100, (directScore + cascadingScore) / 3);

  // Generate recommendations
  const recommendations: string[] = [];
  if (totalScore > 75) {
    recommendations.push('Consider obtaining legal review before modifying this term');
    recommendations.push('Update all dependent financial models');
    recommendations.push('Notify relevant stakeholders of potential cascading effects');
  } else if (totalScore > 50) {
    recommendations.push('Review impacted covenants and update calculations');
    recommendations.push('Verify pricing grid reflects any changes');
  } else if (totalScore > 25) {
    recommendations.push('Minor updates may be needed to downstream references');
  }

  return {
    sourceNodeId: nodeId,
    directImpacts,
    cascadingImpacts,
    totalImpactScore: Math.round(totalScore),
    summary: `Modifying "${sourceNode.name}" would directly impact ${directImpacts.length} terms and cascade to ${cascadingImpacts.length} additional terms. ${totalScore > 50 ? 'This is a high-impact change requiring careful review.' : 'This change has moderate downstream effects.'}`,
    recommendations,
  };
}

/**
 * Get node by ID
 */
export function getNodeById(nodeId: string): CrossRefNode | undefined {
  return mockNodes.find(n => n.id === nodeId);
}

/**
 * Get links for a node
 */
export function getLinksForNode(nodeId: string): { incoming: CrossRefLink[]; outgoing: CrossRefLink[] } {
  return {
    incoming: mockLinks.filter(l => l.targetId === nodeId),
    outgoing: mockLinks.filter(l => l.sourceId === nodeId),
  };
}

/**
 * Get connected nodes for a node
 */
export function getConnectedNodes(nodeId: string): CrossRefNode[] {
  const links = getLinksForNode(nodeId);
  const connectedIds = new Set<string>();

  links.incoming.forEach(l => connectedIds.add(l.sourceId));
  links.outgoing.forEach(l => connectedIds.add(l.targetId));

  return mockNodes.filter(n => connectedIds.has(n.id));
}
