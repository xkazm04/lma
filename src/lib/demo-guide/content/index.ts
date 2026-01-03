/**
 * Demo Guide Content Map
 *
 * Central registry of all demo content for the explore mode guidance system.
 * Organized by exact route path with introduction and explorable sections.
 */

import type { ModuleContent, DemoContent } from '../types';

// ============================================================================
// MODULE CONTENT - Organized by exact route path
// ============================================================================

export const moduleContent: Record<string, ModuleContent> = {
  // ==========================================================================
  // DASHBOARD
  // ==========================================================================
  dashboard: {
    moduleId: 'dashboard',
    moduleName: 'Dashboard',
    introduction:
      'The Dashboard provides a unified command center for your entire loan portfolio. Get instant visibility into portfolio health, active deals, compliance status, and recent activity across all modules.',
    highlights: [
      'Portfolio health scoring',
      'Cross-module activity feed',
      'Risk correlation engine',
    ],
    sections: [
      {
        id: 'dashboard-stats',
        title: 'Portfolio Statistics',
        shortDescription: 'Key metrics and health indicators',
        description:
          'The statistics bar displays critical portfolio metrics including active deals, pending compliance items, documents awaiting review, and overall portfolio health. Each stat card is clickable to drill down into detailed views. Sparklines show recent trends at a glance.',
        icon: 'BarChart3',
      },
      {
        id: 'dashboard-activity',
        title: 'Recent Activity Feed',
        shortDescription: 'Track all platform actions',
        description:
          'The activity feed consolidates actions from across the platform into a chronological timeline. See document uploads, deal status changes, compliance updates, and team member actions. Each activity is clickable to navigate directly to the relevant item.',
        icon: 'Activity',
      },
    ],
  },

  // ==========================================================================
  // DOCUMENTS - Main and all subpages
  // ==========================================================================
  documents: {
    moduleId: 'documents',
    moduleName: 'Document Intelligence Hub',
    introduction:
      'The Document Intelligence Hub uses AI to process, analyze, and extract insights from loan documents. Upload credit agreements, amendments, and supporting documents to automatically identify key terms, risks, and compliance requirements.',
    highlights: [
      'AI-powered extraction',
      'Risk detection',
      'Version comparison',
    ],
    sections: [
      {
        id: 'documents-folder-tree',
        title: 'Document Organization',
        shortDescription: 'Hierarchical folder structure',
        description:
          'Documents are organized in a hierarchical folder structure that mirrors your deal organization. Expand and collapse folders to navigate your document library. Use saved views to quickly access frequently used filter combinations.',
        icon: 'FolderTree',
      },
      {
        id: 'documents-list',
        title: 'Document List & Actions',
        shortDescription: 'Browse and manage documents',
        description:
          'The document list shows all documents matching your current filters. Each row displays key metadata including document type, status, and extraction progress. Click any document to view details, download, or trigger AI analysis.',
        icon: 'FileText',
      },
    ],
  },

  'documents/upload': {
    moduleId: 'documents/upload',
    moduleName: 'Upload Documents',
    introduction:
      'Upload loan documents for AI-powered processing. Drag and drop files or browse to select. Supported formats include PDF, DOCX, and common image formats. The AI will automatically classify, extract key terms, and identify risks.',
    highlights: [
      'Drag-and-drop upload',
      'Auto-classification',
      'Batch processing',
    ],
    sections: [
      {
        id: 'upload-zone',
        title: 'Upload Zone',
        shortDescription: 'Drag and drop files here',
        description:
          'The upload zone accepts multiple files at once. Drag files directly from your desktop or click to browse. Files are validated for format and size before processing begins. Large files are chunked for reliable uploads.',
        icon: 'Upload',
      },
      {
        id: 'ai-processing',
        title: 'AI Processing Pipeline',
        shortDescription: 'Understand what happens after upload',
        description:
          'Once files are uploaded, they are securely stored and encrypted. AI extracts key terms including parties, dates, covenants, and obligations. Low-confidence fields are flagged for your review, and extracted data is linked across all modules.',
        icon: 'Brain',
      },
    ],
  },

  'documents/compare': {
    moduleId: 'documents/compare',
    moduleName: 'Document Comparison',
    introduction:
      'Compare two document versions side-by-side to identify changes. The AI highlights additions, deletions, and modifications at both the text and semantic level. Perfect for reviewing amendments and tracking term evolution.',
    highlights: [
      'Side-by-side diff view',
      'Semantic comparison',
      'Change summary',
    ],
    sections: [
      {
        id: 'comparison-results',
        title: 'Comparison Results',
        shortDescription: 'Summary of document differences',
        description:
          'The comparison results display aggregate statistics showing the total number of additions, deletions, and modifications. Each category shows the impact level with color-coded indicators. Click any category to filter the detailed changes below.',
        icon: 'GitCompare',
      },
      {
        id: 'ai-risk-analysis',
        title: 'AI Risk Analysis',
        shortDescription: 'Risk scoring for document changes',
        description:
          'The AI analyzes each change for potential risk impact. Changes are scored based on severity, commercial significance, and regulatory implications. High-risk changes are flagged for immediate attention with recommended review actions.',
        icon: 'Shield',
      },
    ],
  },

  'documents/risk-detection': {
    moduleId: 'documents/risk-detection',
    moduleName: 'Risk Detection',
    introduction:
      'The Risk Detection module scans documents for potential risks, unusual clauses, and compliance concerns. AI analyzes language patterns, compares against market standards, and flags items requiring human review.',
    highlights: [
      'Automated risk scanning',
      'Category filtering',
      'Priority ranking',
    ],
    sections: [
      {
        id: 'risk-summary',
        title: 'Risk Summary',
        shortDescription: 'Overview of detected risks',
        description:
          'The summary panel shows aggregate risk statistics by category - legal, financial, operational, and compliance. Color-coded indicators highlight severity levels. Click any category to filter the detailed list below.',
        icon: 'Shield',
      },
      {
        id: 'risk-details',
        title: 'Risk Details',
        shortDescription: 'Individual risk findings',
        description:
          'Each detected risk is displayed with its category, severity, source clause, and recommended action. Expand items to see the full context and AI reasoning. Mark items as reviewed or flag for escalation.',
        icon: 'AlertTriangle',
      },
    ],
  },

  'documents/evolution': {
    moduleId: 'documents/evolution',
    moduleName: 'Document Evolution Engine',
    introduction:
      'The Document Evolution Engine provides autonomous monitoring and proactive amendment suggestions. It tracks market conditions, regulatory changes, and term evolution to recommend when documents should be updated.',
    highlights: [
      'Autonomous monitoring',
      'Proactive suggestions',
      'Market intelligence',
    ],
    sections: [
      {
        id: 'evolution-stats',
        title: 'Evolution Engine Status',
        shortDescription: 'System health and monitoring stats',
        description:
          'The stats cards show the current status of the evolution engine including active monitoring count, pending suggestions, market signal health, and amendment success rate. Real-time updates reflect the latest system activity.',
        icon: 'Activity',
      },
      {
        id: 'amendment-suggestions',
        title: 'AI Amendment Suggestions',
        shortDescription: 'Proactive recommendations',
        description:
          'The AI generates amendment suggestions based on market conditions, regulatory changes, and term benchmarks. Each suggestion includes priority level, expected benefit, and a one-click workflow to initiate communication with counterparties.',
        icon: 'Sparkles',
      },
    ],
  },

  'documents/translate': {
    moduleId: 'documents/translate',
    moduleName: 'Document Translation Layer',
    introduction:
      'The Document Translation Layer converts structured data into professional legal clause language. Enter covenant parameters, obligation details, or term values and the AI generates legally-precise clause text.',
    highlights: [
      'Structured to legal',
      'Clause generation',
      'Precedent matching',
    ],
    sections: [
      {
        id: 'clause-input',
        title: 'Clause Input Form',
        shortDescription: 'Define clause parameters',
        description:
          'Select the clause type and enter structured data. For covenants, specify thresholds, testing frequency, and calculation methodology. The form validates inputs and suggests values based on market standards.',
        icon: 'FileText',
      },
      {
        id: 'clause-preview',
        title: 'Generated Clause Preview',
        shortDescription: 'Review AI-generated text',
        description:
          'The preview shows the generated legal clause text with highlighted key terms. Review the output, request regeneration with different parameters, or export to your document. Quality metrics show confidence and readability scores.',
        icon: 'Sparkles',
      },
    ],
  },

  // ==========================================================================
  // DEALS - Main and all subpages
  // ==========================================================================
  deals: {
    moduleId: 'deals',
    moduleName: 'Deal Room',
    introduction:
      'The Deal Room is your collaborative workspace for negotiating and managing loan transactions. Track deal progress, negotiate terms with counterparties, and maintain a complete audit trail of all changes and communications.',
    highlights: [
      'Term negotiation',
      'Pipeline tracking',
      'Audit trail',
    ],
    sections: [
      {
        id: 'deals-list',
        title: 'Deal Pipeline',
        shortDescription: 'Track all deals through stages',
        description:
          'The deal pipeline displays all active and recent deals organized by status. See key metrics like deal amount, counterparty, and days in current stage. Filter by status, type, or team member to focus on relevant deals.',
        icon: 'Handshake',
      },
      {
        id: 'deals-stages',
        title: 'Deal Stages & Progress',
        shortDescription: 'Visual pipeline progression',
        description:
          'Each deal moves through defined stages from initial inquiry to closing. The stage indicator shows current position and highlights blockers. AI predictions estimate time to close based on historical patterns.',
        icon: 'GitBranch',
      },
    ],
  },

  'deals/new': {
    moduleId: 'deals/new',
    moduleName: 'Create New Deal',
    introduction:
      'Start a new deal by entering key details. The wizard guides you through borrower information, deal structure, and initial terms. Import terms from existing facilities or start fresh.',
    highlights: [
      'Guided wizard',
      'Facility import',
      'Multi-step setup',
    ],
    sections: [
      {
        id: 'deal-wizard',
        title: 'Deal Creation Wizard',
        shortDescription: 'Step-by-step deal setup',
        description:
          'The multi-step wizard guides you through deal creation: basic details, import source (optional), participants, and settings. Import existing facility terms to pre-populate the deal, or start fresh. Progress is saved between steps.',
        icon: 'Layers',
      },
      {
        id: 'deal-participants',
        title: 'Participant Management',
        shortDescription: 'Add deal participants',
        description:
          'Add counterparties, agents, and other participants to your deal. Specify roles and permissions for each party. The system validates email addresses and suggests previously used contacts.',
        icon: 'Users',
      },
    ],
  },

  'deals/intelligence': {
    moduleId: 'deals/intelligence',
    moduleName: 'Deal Intelligence',
    introduction:
      'Access AI-powered insights across your deal portfolio. The intelligence dashboard aggregates patterns, identifies opportunities, and surfaces risks. Use market data to benchmark your terms and timing.',
    highlights: [
      'Portfolio insights',
      'Market benchmarks',
      'Risk patterns',
    ],
    sections: [
      {
        id: 'intelligence-insights',
        title: 'AI Insights',
        shortDescription: 'Pattern recognition across deals',
        description:
          'The AI analyzes your deal portfolio to identify patterns and trends. See which terms are most negotiated, average time in each stage, and common bottlenecks. Use insights to improve your process.',
        icon: 'Brain',
      },
      {
        id: 'intelligence-benchmarks',
        title: 'Market Benchmarks',
        shortDescription: 'Compare against market data',
        description:
          'Compare your deal terms against market standards. See where you are above or below market on pricing, covenants, and structure. Historical trends show how the market is moving.',
        icon: 'TrendingUp',
      },
    ],
  },

  'deals/term-intelligence': {
    moduleId: 'deals/term-intelligence',
    moduleName: 'Cross-Deal Term Intelligence',
    introduction:
      'Executive dashboard for strategic insights across your entire deal portfolio. Analyze margin performance, counterparty patterns, and negotiation sequences to optimize future deals.',
    highlights: [
      'Portfolio analytics',
      'Margin tracking',
      'Counterparty insights',
    ],
    sections: [
      {
        id: 'portfolio-performance',
        title: 'Portfolio Performance',
        shortDescription: 'Aggregate deal metrics',
        description:
          'The portfolio performance card shows key metrics across all deals: total volume, average margin delta vs. market, win rate on key terms, and negotiation efficiency. Compare your performance against market benchmarks.',
        icon: 'BarChart3',
      },
      {
        id: 'margin-analysis',
        title: 'Margin Delta Analysis',
        shortDescription: 'Track margin performance',
        description:
          'The margin delta chart visualizes your pricing outcomes vs. initial ask across all deals. See trends over time, identify outliers, and understand which deal types or counterparties yield the best margins.',
        icon: 'TrendingUp',
      },
    ],
  },

  // ==========================================================================
  // COMPLIANCE - Main and all subpages
  // ==========================================================================
  compliance: {
    moduleId: 'compliance',
    moduleName: 'Compliance Tracker',
    introduction:
      'The Compliance Tracker helps you stay ahead of covenant requirements, reporting deadlines, and regulatory obligations. AI-powered monitoring predicts potential breaches before they occur, giving you time to work with borrowers on remediation.',
    highlights: [
      'Breach prediction',
      'Deadline tracking',
      'Facility monitoring',
    ],
    sections: [
      {
        id: 'compliance-deadlines',
        title: 'Upcoming Deadlines',
        shortDescription: 'Never miss a compliance deadline',
        description:
          'The deadline list shows all upcoming compliance events organized by date. Items are color-coded by urgency - red for overdue, amber for due soon, and gray for future items. Each deadline shows the facility, obligation type, and required action.',
        icon: 'Calendar',
      },
      {
        id: 'compliance-facilities',
        title: 'Facilities at Risk',
        shortDescription: 'Identify compliance risks',
        description:
          'This section highlights facilities with compliance concerns. See covenant headroom percentages, recent test results, and trend indicators. Facilities approaching thresholds are flagged for proactive engagement.',
        icon: 'AlertTriangle',
      },
    ],
  },

  'compliance/calendar': {
    moduleId: 'compliance/calendar',
    moduleName: 'Obligation Calendar',
    introduction:
      'The Obligation Calendar provides a time-based view of all compliance events and deadlines. Switch between calendar and list views to see upcoming obligations organized by date or by facility.',
    highlights: [
      'Calendar view',
      'List view',
      'Export to calendar',
    ],
    sections: [
      {
        id: 'calendar-view',
        title: 'Calendar View',
        shortDescription: 'Visual timeline of obligations',
        description:
          'The calendar view displays obligations as events on a monthly calendar. Events are color-coded by type - blue for compliance, purple for covenants, amber for notifications. Navigate between months to plan ahead.',
        icon: 'Calendar',
      },
      {
        id: 'calendar-list',
        title: 'List View',
        shortDescription: 'Detailed obligation listing',
        description:
          'The list view shows obligations in a detailed table format with full metadata. Sort by date, facility, or type. Bulk select items to mark complete or export.',
        icon: 'List',
      },
    ],
  },

  'compliance/covenants': {
    moduleId: 'compliance/covenants',
    moduleName: 'Covenant Tracking',
    introduction:
      'Track covenant tests and headroom across all facilities. The covenant tracker monitors financial ratios, performance metrics, and reporting requirements. Import test results from spreadsheets or connect to data sources for automated monitoring.',
    highlights: [
      'Headroom calculations',
      'Test history',
      'Trend analysis',
    ],
    sections: [
      {
        id: 'covenants-stats',
        title: 'Covenant Status Overview',
        shortDescription: 'At-a-glance covenant health',
        description:
          'The status bar shows aggregate covenant statistics - total covenants, passing, at risk, and failing. At-risk covenants are those approaching threshold limits. Entropy indicators highlight volatile performance patterns.',
        icon: 'BarChart3',
      },
      {
        id: 'covenants-list',
        title: 'Covenant Details',
        shortDescription: 'Individual covenant monitoring',
        description:
          'Each covenant card shows current value, threshold, headroom percentage, and trend. Expand cards to see test history and contributing factors. Quick actions let you add test results or request waivers.',
        icon: 'ClipboardCheck',
      },
    ],
  },

  'compliance/facilities': {
    moduleId: 'compliance/facilities',
    moduleName: 'Compliance Facilities',
    introduction:
      'Manage compliance tracking at the facility level. Each facility has its own set of covenants, obligations, and reporting requirements. View facility-level compliance status and drill down into specific requirements.',
    highlights: [
      'Facility dashboard',
      'Aggregate status',
      'Document tracking',
    ],
    sections: [
      {
        id: 'facilities-table',
        title: 'Facilities Overview',
        shortDescription: 'Compliance status by facility',
        description:
          'The facilities table shows all tracked facilities with their compliance status. See commitment amounts, maturity dates, obligation counts, and alert indicators. Filter by status to focus on facilities requiring attention.',
        icon: 'Building2',
      },
      {
        id: 'facilities-alerts',
        title: 'Alert Indicators',
        shortDescription: 'Quick visual compliance status',
        description:
          'Alert indicators provide at-a-glance compliance status for each facility. Red alerts indicate overdue items or breaches. Amber indicates items approaching deadlines. Green confirms all current.',
        icon: 'AlertTriangle',
      },
    ],
  },

  'compliance/autopilot': {
    moduleId: 'compliance/autopilot',
    moduleName: 'Predictive Compliance Autopilot',
    introduction:
      'The Autopilot uses multi-signal intelligence to predict covenant breaches months in advance. By analyzing market data, transaction patterns, news sentiment, and historical performance, the AI identifies at-risk covenants and recommends remediation strategies.',
    highlights: [
      'Breach prediction',
      'Multi-signal analysis',
      'Remediation playbooks',
    ],
    sections: [
      {
        id: 'autopilot-stats',
        title: 'Autopilot Dashboard',
        shortDescription: 'System status and key metrics',
        description:
          'The stats bar shows key autopilot metrics: active predictions, critical alerts, signals processed, and remediation success rate. Color-coded indicators highlight areas requiring attention.',
        icon: 'Gauge',
      },
      {
        id: 'predictions',
        title: 'Risk Predictions',
        shortDescription: 'AI-powered breach forecasting',
        description:
          'Prediction cards show each at-risk covenant with breach probability, confidence level, and contributing signals. Filter by risk level to focus on critical items. Click any prediction to see detailed analysis and recommended actions.',
        icon: 'Brain',
      },
    ],
  },

  'compliance/simulation': {
    moduleId: 'compliance/simulation',
    moduleName: 'Scenario Simulation',
    introduction:
      'Run what-if scenarios to understand how different conditions would impact covenant compliance. Stress test your portfolio against market shocks, borrower performance changes, or structural modifications.',
    highlights: [
      'What-if analysis',
      'Stress testing',
      'Impact modeling',
    ],
    sections: [
      {
        id: 'simulation-inputs',
        title: 'Scenario Inputs',
        shortDescription: 'Define simulation parameters',
        description:
          'Configure your scenario by adjusting financial metrics, market conditions, or facility terms. Use preset scenarios for common stress tests or create custom combinations. Multiple scenarios can be compared side-by-side.',
        icon: 'Settings',
      },
      {
        id: 'simulation-results',
        title: 'Impact Results',
        shortDescription: 'View simulation outcomes',
        description:
          'See how each scenario impacts covenant headroom, breach probability, and overall portfolio health. Drill down into individual facilities to understand specific impacts. Export results for reporting.',
        icon: 'LineChart',
      },
    ],
  },

  'compliance/live-testing': {
    moduleId: 'compliance/live-testing',
    moduleName: 'Live Covenant Testing',
    introduction:
      'Connect to live data feeds for real-time covenant testing. The system automatically pulls financial data, calculates ratios, and alerts you when thresholds are approached or breached.',
    highlights: [
      'Real-time testing',
      'Auto-calculations',
      'Alert triggers',
    ],
    sections: [
      {
        id: 'live-feeds',
        title: 'Data Feeds',
        shortDescription: 'Connected data sources',
        description:
          'View all connected data sources feeding into the live testing system. See connection status, last update time, and data quality indicators. Add new connections or troubleshoot existing ones.',
        icon: 'Activity',
      },
      {
        id: 'live-tests',
        title: 'Active Tests',
        shortDescription: 'Real-time covenant calculations',
        description:
          'Active tests show current covenant values calculated from live data. See real-time headroom as data updates. Historical charts show how values have trended since the last formal test date.',
        icon: 'Gauge',
      },
    ],
  },

  'compliance/agent': {
    moduleId: 'compliance/agent',
    moduleName: 'Compliance AI Agent',
    introduction:
      'Chat with the AI compliance agent to get instant answers about your portfolio. Ask questions in natural language about deadlines, covenant status, or compliance requirements. The agent can also help draft documents and communications.',
    highlights: [
      'Natural language',
      'Instant answers',
      'Document drafting',
    ],
    sections: [
      {
        id: 'agent-chat',
        title: 'Chat Interface',
        shortDescription: 'Ask questions naturally',
        description:
          'Type questions in plain English and get instant answers with citations. Ask about specific facilities, upcoming deadlines, or compliance requirements. The agent remembers context from your conversation.',
        icon: 'Brain',
      },
      {
        id: 'agent-actions',
        title: 'Quick Actions',
        shortDescription: 'Common compliance tasks',
        description:
          'Quick action buttons let you trigger common tasks like generating compliance reports, drafting reminder emails, or calculating covenant tests. The agent executes tasks and shows results inline.',
        icon: 'Zap',
      },
    ],
  },

  'compliance/benchmarks': {
    moduleId: 'compliance/benchmarks',
    moduleName: 'Compliance Benchmarks',
    introduction:
      'Compare your compliance performance against industry benchmarks. See how your covenant structures, headroom levels, and breach rates compare to peers. Identify areas for improvement and best practices.',
    highlights: [
      'Peer comparison',
      'Industry benchmarks',
      'Best practices',
    ],
    sections: [
      {
        id: 'benchmark-comparison',
        title: 'Peer Comparison',
        shortDescription: 'How you compare to peers',
        description:
          'Charts show your compliance metrics alongside industry averages and top performers. See where you excel and where there is room for improvement. Filter by deal type, size, or sector for relevant comparisons.',
        icon: 'BarChart3',
      },
      {
        id: 'benchmark-trends',
        title: 'Trend Analysis',
        shortDescription: 'Track improvement over time',
        description:
          'Track how your compliance performance has evolved over time. See if you are converging toward or diverging from benchmarks. Identify seasonal patterns and plan accordingly.',
        icon: 'TrendingUp',
      },
    ],
  },

  'compliance/covenant-network': {
    moduleId: 'compliance/covenant-network',
    moduleName: 'Covenant Network',
    introduction:
      'Visualize relationships between covenants across your portfolio. The network view shows how covenants are interconnected and how breaches in one area could cascade to others. Understand systemic risks.',
    highlights: [
      'Relationship mapping',
      'Cascade analysis',
      'Systemic risk',
    ],
    sections: [
      {
        id: 'network-graph',
        title: 'Network Visualization',
        shortDescription: 'Interactive covenant graph',
        description:
          'The network graph shows covenants as nodes with connections representing dependencies. Node size indicates exposure amount, color indicates health. Click nodes to see details and connected covenants.',
        icon: 'Network',
      },
      {
        id: 'network-paths',
        title: 'Cascade Paths',
        shortDescription: 'Breach propagation analysis',
        description:
          'Cascade analysis shows how a breach in one covenant could trigger issues in connected covenants. The AI calculates propagation probability and potential impact. Use this for stress testing.',
        icon: 'GitBranch',
      },
    ],
  },

  'compliance/headroom-exchange': {
    moduleId: 'compliance/headroom-exchange',
    moduleName: 'Headroom Exchange',
    introduction:
      'Optimize covenant headroom across your portfolio. The exchange identifies opportunities to reallocate capacity between facilities or structure amendments that improve overall compliance flexibility.',
    highlights: [
      'Headroom optimization',
      'Capacity reallocation',
      'Amendment structuring',
    ],
    sections: [
      {
        id: 'exchange-opportunities',
        title: 'Optimization Opportunities',
        shortDescription: 'AI-identified improvements',
        description:
          'The AI identifies facilities with excess headroom that could provide capacity to constrained facilities. See potential amendments, reallocation options, and estimated impact on overall portfolio flexibility.',
        icon: 'Target',
      },
      {
        id: 'exchange-modeling',
        title: 'Impact Modeling',
        shortDescription: 'Simulate proposed changes',
        description:
          'Model the impact of proposed headroom exchanges before execution. See how changes affect each facility and the overall portfolio. Compare multiple options to find the optimal solution.',
        icon: 'LineChart',
      },
    ],
  },

  'compliance/automated-calendar': {
    moduleId: 'compliance/automated-calendar',
    moduleName: 'Automated Calendar',
    introduction:
      'AI-powered calendar that automatically detects deadlines from documents and syncs with your calendar systems. Never miss an obligation because the system handles deadline tracking for you.',
    highlights: [
      'Auto-detection',
      'Calendar sync',
      'Smart reminders',
    ],
    sections: [
      {
        id: 'auto-detection',
        title: 'Deadline Detection',
        shortDescription: 'AI extracts dates from documents',
        description:
          'The AI scans all uploaded documents for deadline mentions and automatically adds them to your calendar. Review detected deadlines to confirm accuracy. The system learns from your corrections.',
        icon: 'Brain',
      },
      {
        id: 'auto-sync',
        title: 'Calendar Integration',
        shortDescription: 'Sync with external calendars',
        description:
          'Connect to Outlook, Google Calendar, or other systems for automatic synchronization. Deadlines appear in your regular calendar with links back to the platform. Two-way sync keeps everything current.',
        icon: 'Calendar',
      },
    ],
  },

  // ==========================================================================
  // TRADING - Main and subpages
  // ==========================================================================
  trading: {
    moduleId: 'trading',
    moduleName: 'Trading',
    introduction:
      'The Trading module streamlines secondary market loan transactions. Track trades through the settlement process, manage due diligence checklists, and monitor your position portfolio. AI assists with document review and consent tracking.',
    highlights: [
      'Trade lifecycle',
      'DD checklists',
      'Position tracking',
    ],
    sections: [
      {
        id: 'trading-dashboard',
        title: 'Trading Dashboard',
        shortDescription: 'Trade and position overview',
        description:
          'The dashboard shows key trading metrics - active trades, pending settlements, and portfolio P&L. The settlements calendar highlights upcoming settlement dates. Recent activity shows trade status changes and DD progress.',
        icon: 'ArrowLeftRight',
      },
      {
        id: 'trading-tables',
        title: 'Trades & Positions',
        shortDescription: 'Detailed trade and position data',
        description:
          'Switch between trades and positions views using the tab selector. The trades table shows status, amount, DD progress, and settlement dates. The positions table shows holdings with cost basis, market value, and unrealized P&L. Edit prices inline.',
        icon: 'BarChart3',
      },
    ],
  },
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get module content by moduleId (exact path match)
 */
export function getModuleContent(moduleId: string): ModuleContent | undefined {
  return moduleContent[moduleId];
}

/**
 * Get all module IDs
 */
export function getAllModuleIds(): string[] {
  return Object.keys(moduleContent);
}

/**
 * Get section count for a module
 */
export function getSectionCount(moduleId: string): number {
  return moduleContent[moduleId]?.sections.length ?? 0;
}

/**
 * Find section by ID across all modules
 */
export function findSectionById(sectionId: string): { module: ModuleContent; section: import('../types').DemoSection } | null {
  for (const mod of Object.values(moduleContent)) {
    const section = mod.sections.find(s => s.id === sectionId);
    if (section) {
      return { module: mod, section };
    }
  }
  return null;
}

// ============================================================================
// LEGACY SUPPORT - DemoContent format
// ============================================================================

export const dashboardContent: Record<string, DemoContent> = {};
export const documentsContent: Record<string, DemoContent> = {};
export const dealsContent: Record<string, DemoContent> = {};
export const complianceContent: Record<string, DemoContent> = {};
export const tradingContent: Record<string, DemoContent> = {};
export const esgContent: Record<string, DemoContent> = {};

export const demoContentMap: Record<string, DemoContent> = {
  ...dashboardContent,
  ...documentsContent,
  ...dealsContent,
  ...complianceContent,
  ...tradingContent,
  ...esgContent,
};

export function getDemoContent(id: string): DemoContent | undefined {
  return demoContentMap[id];
}

export function getDemoContentByCategory(category: string): DemoContent[] {
  return Object.values(demoContentMap).filter((demo) => demo.category === category);
}

export function getDemoContentCount(): number {
  return Object.values(moduleContent).reduce((acc, mod) => acc + mod.sections.length, 0);
}
