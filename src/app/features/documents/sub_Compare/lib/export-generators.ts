// Export Generators for Document Comparison
// Generates PDF, DOCX, and XLSX exports with annotations preserved

import type { ComparisonResult } from '@/types';
import type { ComparisonRiskAnalysis, ComparisonCategory, ComparisonChange } from '../../lib/types';
import type { Annotation, AnnotationsMap, ReviewStatus } from './types';
import type {
  ExportConfig,
  ExportData,
  ExportableCategory,
  ExportableChange,
  ExportFormat,
  AuditTrailEntry,
} from './export-types';
import { REVIEW_STATUS_CONFIG } from './types';
import { createChangeId } from './mock-data';

// ============================================
// Helper: Transform flat differences to categories
// ============================================

interface FlatDifference {
  field: string;
  category: string;
  document1Value: unknown;
  document2Value: unknown;
  changeType: 'added' | 'removed' | 'modified';
}

/**
 * Transform flat differences array to categorized format
 */
function transformToCategories(differences: FlatDifference[]): ComparisonCategory[] {
  const categoryMap = new Map<string, ComparisonChange[]>();

  for (const diff of differences) {
    const change: ComparisonChange = {
      field: diff.field,
      doc1Value: diff.document1Value as string | null,
      doc2Value: diff.document2Value as string | null,
      changeType: diff.changeType,
      impact: '', // Will be computed if needed
    };

    const existing = categoryMap.get(diff.category);
    if (existing) {
      existing.push(change);
    } else {
      categoryMap.set(diff.category, [change]);
    }
  }

  return Array.from(categoryMap.entries()).map(([category, changes]) => ({
    category,
    changes,
  }));
}

// ============================================
// Data Preparation
// ============================================

/**
 * Prepare export data from comparison result and annotations
 */
export function prepareExportData(
  config: ExportConfig,
  comparisonResult: ComparisonResult,
  annotations: AnnotationsMap,
  riskAnalysis?: ComparisonRiskAnalysis | null,
  auditTrail?: AuditTrailEntry[]
): ExportData {
  // Transform flat differences to categorized format
  const categories = transformToCategories(comparisonResult.differences as FlatDifference[]);

  // Calculate statistics
  let totalChanges = 0;
  let addedCount = 0;
  let removedCount = 0;
  let modifiedCount = 0;
  let annotatedCount = 0;

  // Count by review status
  const statusCounts: Record<ReviewStatus, number> = {
    pending: 0,
    reviewed: 0,
    flagged: 0,
    requires_legal: 0,
  };

  // Process categories and apply filters
  const exportableCategories: ExportableCategory[] = [];

  for (const category of categories) {
    // Check if category should be included
    if (config.filters.categories !== 'all' &&
        !config.filters.categories.includes(category.category)) {
      continue;
    }

    const exportableChanges: ExportableChange[] = [];

    for (const change of category.changes) {
      totalChanges++;

      // Count by change type
      if (change.changeType === 'added') addedCount++;
      else if (change.changeType === 'removed') removedCount++;
      else if (change.changeType === 'modified') modifiedCount++;

      // Apply change type filters
      if (!config.filters.includeAdded && change.changeType === 'added') continue;
      if (!config.filters.includeRemoved && change.changeType === 'removed') continue;
      if (!config.filters.includeModified && change.changeType === 'modified') continue;

      // Get annotation for this change
      const changeId = createChangeId(category.category, change.field);
      const annotation = annotations.get(changeId);

      if (annotation) {
        annotatedCount++;
        statusCounts[annotation.reviewStatus]++;
      }

      // Apply annotation filters
      if (config.filters.annotatedOnly && !annotation) continue;
      if (config.filters.withCommentsOnly && (!annotation || annotation.comments.length === 0)) continue;

      // Apply review status filter
      if (config.filters.reviewStatuses !== 'all' && annotation) {
        if (!config.filters.reviewStatuses.includes(annotation.reviewStatus)) continue;
      }

      // Get risk score if available
      let riskScore: ExportableChange['riskScore'] | undefined;
      if (config.includeRiskScores && riskAnalysis) {
        const score = riskAnalysis.changeScores.find((s) => s.changeId === changeId);
        if (score) {
          // Apply minimum risk score filter
          if (config.filters.minRiskScore !== null &&
              score.severityScore < config.filters.minRiskScore) {
            continue;
          }
          riskScore = {
            severityScore: score.severityScore,
            severity: score.severity,
            favoredParty: score.favoredParty,
            riskAnalysis: score.riskAnalysis,
          };
        }
      }

      // Get market benchmark if available
      let marketBenchmark: ExportableChange['marketBenchmark'] | undefined;
      if (config.includeMarketBenchmarks && riskAnalysis) {
        const benchmark = riskAnalysis.marketBenchmarks.find((b) => b.changeId === changeId);
        if (benchmark) {
          marketBenchmark = {
            marketRangeLow: benchmark.marketRangeLow,
            marketRangeHigh: benchmark.marketRangeHigh,
            marketMedian: benchmark.marketMedian,
            marketPosition: benchmark.marketPosition,
            percentile: benchmark.percentile,
          };
        }
      }

      exportableChanges.push({
        change,
        category: category.category,
        changeId,
        annotation,
        riskScore,
        marketBenchmark,
      });
    }

    if (exportableChanges.length > 0) {
      // Get category risk summary if available
      let riskSummary: ExportableCategory['riskSummary'] | undefined;
      if (config.includeRiskScores && riskAnalysis) {
        const catSummary = riskAnalysis.summary.categorySummaries.find(
          (s) => s.category === category.category
        );
        if (catSummary) {
          riskSummary = {
            averageSeverityScore: catSummary.averageSeverityScore,
            borrowerFavoredCount: catSummary.borrowerFavoredCount,
            lenderFavoredCount: catSummary.lenderFavoredCount,
            neutralCount: catSummary.neutralCount,
          };
        }
      }

      exportableCategories.push({
        category: category.category,
        changes: exportableChanges,
        riskSummary,
      });
    }
  }

  // Build export data
  const exportData: ExportData = {
    config,
    metadata: {
      document1: {
        id: comparisonResult.document1.id || 'doc1',
        name: comparisonResult.document1.name,
      },
      document2: {
        id: comparisonResult.document2.id || 'doc2',
        name: comparisonResult.document2.name,
      },
      comparedAt: new Date().toISOString(),
      exportedAt: new Date().toISOString(),
      exportedBy: config.generatedBy,
    },
    impactAnalysis: comparisonResult.impactAnalysis || '',
    statistics: {
      totalChanges,
      addedCount,
      removedCount,
      modifiedCount,
      categoriesCount: exportableCategories.length,
      annotatedCount,
      reviewedCount: statusCounts.reviewed,
      flaggedCount: statusCounts.flagged,
      requiresLegalCount: statusCounts.requires_legal,
      pendingCount: statusCounts.pending,
    },
    categories: exportableCategories,
  };

  // Add executive summary if risk analysis available
  if (riskAnalysis) {
    exportData.executiveSummary = riskAnalysis.summary.executiveSummary;
    exportData.riskAnalysisSummary = {
      overallRiskScore: riskAnalysis.summary.overallRiskScore,
      overallSeverity: riskAnalysis.summary.overallSeverity,
      overallDirection: riskAnalysis.summary.overallDirection,
      highRiskCount: riskAnalysis.summary.highRiskCount,
      keyFindings: riskAnalysis.summary.keyFindings,
      executiveSummary: riskAnalysis.summary.executiveSummary,
    };
  }

  // Add audit trail if provided
  if (auditTrail && auditTrail.length > 0) {
    exportData.auditTrail = auditTrail;
  }

  return exportData;
}

// ============================================
// PDF Generator
// ============================================

/**
 * Generate PDF content structure
 * In production, this would use a library like jsPDF or pdf-lib
 */
export function generatePDFContent(data: ExportData): PDFDocumentStructure {
  const sections: PDFSection[] = [];
  const includedSections = data.config.sections
    .filter((s) => s.included)
    .sort((a, b) => a.order - b.order);

  for (const sectionConfig of includedSections) {
    switch (sectionConfig.section) {
      case 'document_metadata':
        sections.push(generateMetadataSection(data));
        break;
      case 'executive_summary':
        if (data.executiveSummary) {
          sections.push(generateExecutiveSummarySection(data));
        }
        break;
      case 'change_statistics':
        sections.push(generateStatisticsSection(data));
        break;
      case 'risk_analysis':
        if (data.riskAnalysisSummary) {
          sections.push(generateRiskAnalysisSection(data));
        }
        break;
      case 'market_benchmarks':
        sections.push(generateMarketBenchmarksSection(data));
        break;
      case 'impact_analysis':
        sections.push(generateImpactAnalysisSection(data));
        break;
      case 'changes_by_category':
        sections.push(generateChangesSection(data));
        break;
      case 'annotations':
        sections.push(generateAnnotationsSection(data));
        break;
      case 'comments':
        sections.push(generateCommentsSection(data));
        break;
      case 'review_status':
        sections.push(generateReviewStatusSection(data));
        break;
      case 'audit_trail':
        if (data.auditTrail) {
          sections.push(generateAuditTrailSection(data));
        }
        break;
    }
  }

  return {
    title: `Document Comparison Report`,
    subtitle: `${data.metadata.document1.name} vs ${data.metadata.document2.name}`,
    styling: data.config.styling,
    sections,
    footer: {
      generatedAt: data.metadata.exportedAt,
      generatedBy: data.metadata.exportedBy?.name,
    },
  };
}

// PDF Section generators
function generateMetadataSection(data: ExportData): PDFSection {
  return {
    title: 'Document Information',
    type: 'metadata',
    content: {
      rows: [
        { label: 'Original Document', value: data.metadata.document1.name },
        { label: 'Amended Document', value: data.metadata.document2.name },
        { label: 'Comparison Date', value: new Date(data.metadata.comparedAt).toLocaleDateString() },
        { label: 'Export Date', value: new Date(data.metadata.exportedAt).toLocaleDateString() },
        ...(data.metadata.exportedBy ? [{ label: 'Generated By', value: data.metadata.exportedBy.name }] : []),
      ],
    },
  };
}

function generateExecutiveSummarySection(data: ExportData): PDFSection {
  return {
    title: 'Executive Summary',
    type: 'text',
    content: {
      text: data.executiveSummary || '',
      highlights: data.riskAnalysisSummary?.keyFindings || [],
    },
  };
}

function generateStatisticsSection(data: ExportData): PDFSection {
  return {
    title: 'Change Statistics',
    type: 'statistics',
    content: {
      stats: [
        { label: 'Total Changes', value: data.statistics.totalChanges, color: '#3b82f6' },
        { label: 'Added', value: data.statistics.addedCount, color: '#22c55e' },
        { label: 'Removed', value: data.statistics.removedCount, color: '#ef4444' },
        { label: 'Modified', value: data.statistics.modifiedCount, color: '#f59e0b' },
        { label: 'Categories', value: data.statistics.categoriesCount, color: '#8b5cf6' },
      ],
      reviewStats: [
        { label: 'Reviewed', value: data.statistics.reviewedCount, color: '#22c55e' },
        { label: 'Flagged', value: data.statistics.flaggedCount, color: '#f59e0b' },
        { label: 'Requires Legal', value: data.statistics.requiresLegalCount, color: '#8b5cf6' },
        { label: 'Pending', value: data.statistics.pendingCount, color: '#6b7280' },
      ],
    },
  };
}

function generateRiskAnalysisSection(data: ExportData): PDFSection {
  if (!data.riskAnalysisSummary) {
    return { title: 'Risk Analysis', type: 'empty', content: {} };
  }

  return {
    title: 'Risk Analysis',
    type: 'risk',
    content: {
      overallScore: data.riskAnalysisSummary.overallRiskScore,
      severity: data.riskAnalysisSummary.overallSeverity,
      direction: data.riskAnalysisSummary.overallDirection,
      highRiskCount: data.riskAnalysisSummary.highRiskCount,
      findings: data.riskAnalysisSummary.keyFindings,
    },
  };
}

function generateMarketBenchmarksSection(data: ExportData): PDFSection {
  const benchmarks: Array<{
    field: string;
    category: string;
    value: string;
    marketRange: string;
    position: string;
  }> = [];

  for (const category of data.categories) {
    for (const change of category.changes) {
      if (change.marketBenchmark) {
        benchmarks.push({
          field: change.change.field,
          category: category.category,
          value: change.change.doc2Value || change.change.doc1Value || '',
          marketRange: `${change.marketBenchmark.marketRangeLow} - ${change.marketBenchmark.marketRangeHigh}`,
          position: change.marketBenchmark.marketPosition.replace('_', ' '),
        });
      }
    }
  }

  return {
    title: 'Market Benchmarks',
    type: 'table',
    content: {
      headers: ['Field', 'Category', 'Value', 'Market Range', 'Position'],
      rows: benchmarks.map((b) => [b.field, b.category, b.value, b.marketRange, b.position]),
    },
  };
}

function generateImpactAnalysisSection(data: ExportData): PDFSection {
  return {
    title: 'Impact Analysis',
    type: 'text',
    content: {
      text: data.impactAnalysis,
    },
  };
}

function generateChangesSection(data: ExportData): PDFSection {
  const categories: Array<{
    name: string;
    changes: Array<{
      field: string;
      changeType: string;
      oldValue: string | null;
      newValue: string | null;
      impact: string;
      riskScore?: number;
      reviewStatus?: string;
    }>;
  }> = [];

  for (const category of data.categories) {
    const changes = category.changes.map((c) => ({
      field: c.change.field,
      changeType: c.change.changeType,
      oldValue: c.change.doc1Value,
      newValue: c.change.doc2Value,
      impact: c.change.impact,
      riskScore: c.riskScore?.severityScore,
      reviewStatus: c.annotation ? REVIEW_STATUS_CONFIG[c.annotation.reviewStatus].label : undefined,
    }));

    categories.push({
      name: category.category,
      changes,
    });
  }

  return {
    title: 'Detailed Changes',
    type: 'changes',
    content: { categories },
  };
}

function generateAnnotationsSection(data: ExportData): PDFSection {
  const annotations: Array<{
    field: string;
    category: string;
    status: string;
    commentCount: number;
    createdBy: string;
    createdAt: string;
  }> = [];

  for (const category of data.categories) {
    for (const change of category.changes) {
      if (change.annotation) {
        annotations.push({
          field: change.change.field,
          category: category.category,
          status: REVIEW_STATUS_CONFIG[change.annotation.reviewStatus].label,
          commentCount: change.annotation.comments.length,
          createdBy: change.annotation.createdBy.name,
          createdAt: new Date(change.annotation.createdAt).toLocaleDateString(),
        });
      }
    }
  }

  return {
    title: 'Annotations',
    type: 'table',
    content: {
      headers: ['Field', 'Category', 'Status', 'Comments', 'Created By', 'Date'],
      rows: annotations.map((a) => [
        a.field, a.category, a.status, String(a.commentCount), a.createdBy, a.createdAt
      ]),
    },
  };
}

function generateCommentsSection(data: ExportData): PDFSection {
  const comments: Array<{
    field: string;
    author: string;
    content: string;
    date: string;
    mentions: string[];
  }> = [];

  for (const category of data.categories) {
    for (const change of category.changes) {
      if (change.annotation) {
        for (const comment of change.annotation.comments) {
          comments.push({
            field: change.change.field,
            author: comment.author.name,
            content: comment.content,
            date: new Date(comment.createdAt).toLocaleDateString(),
            mentions: comment.mentions.map((m) => m.userName),
          });
        }
      }
    }
  }

  return {
    title: 'Comments',
    type: 'comments',
    content: { comments },
  };
}

function generateReviewStatusSection(data: ExportData): PDFSection {
  const statusBreakdown = [
    { status: 'Reviewed', count: data.statistics.reviewedCount, color: '#22c55e' },
    { status: 'Flagged', count: data.statistics.flaggedCount, color: '#f59e0b' },
    { status: 'Requires Legal', count: data.statistics.requiresLegalCount, color: '#8b5cf6' },
    { status: 'Pending', count: data.statistics.pendingCount, color: '#6b7280' },
  ];

  return {
    title: 'Review Status Summary',
    type: 'statistics',
    content: {
      stats: statusBreakdown.map((s) => ({
        label: s.status,
        value: s.count,
        color: s.color,
      })),
    },
  };
}

function generateAuditTrailSection(data: ExportData): PDFSection {
  if (!data.auditTrail) {
    return { title: 'Audit Trail', type: 'empty', content: {} };
  }

  return {
    title: 'Audit Trail',
    type: 'table',
    content: {
      headers: ['Timestamp', 'User', 'Action', 'Description'],
      rows: data.auditTrail.map((entry) => [
        new Date(entry.timestamp).toLocaleString(),
        entry.user.name,
        entry.action.replace('_', ' '),
        entry.description,
      ]),
    },
  };
}

// ============================================
// Excel Generator
// ============================================

/**
 * Generate Excel workbook structure
 * In production, this would use a library like xlsx or exceljs
 */
export function generateExcelContent(data: ExportData): ExcelWorkbookStructure {
  const sheets: ExcelSheet[] = [];

  // Summary sheet
  sheets.push({
    name: 'Summary',
    columns: [
      { header: 'Property', key: 'property', width: 25 },
      { header: 'Value', key: 'value', width: 50 },
    ],
    rows: [
      { property: 'Original Document', value: data.metadata.document1.name },
      { property: 'Amended Document', value: data.metadata.document2.name },
      { property: 'Comparison Date', value: new Date(data.metadata.comparedAt).toLocaleDateString() },
      { property: 'Export Date', value: new Date(data.metadata.exportedAt).toLocaleDateString() },
      { property: 'Total Changes', value: String(data.statistics.totalChanges) },
      { property: 'Added', value: String(data.statistics.addedCount) },
      { property: 'Removed', value: String(data.statistics.removedCount) },
      { property: 'Modified', value: String(data.statistics.modifiedCount) },
      { property: 'Reviewed', value: String(data.statistics.reviewedCount) },
      { property: 'Flagged', value: String(data.statistics.flaggedCount) },
      { property: 'Requires Legal', value: String(data.statistics.requiresLegalCount) },
      { property: 'Pending', value: String(data.statistics.pendingCount) },
    ],
  });

  // Changes sheet
  const changesRows: Record<string, string>[] = [];
  for (const category of data.categories) {
    for (const change of category.changes) {
      changesRows.push({
        category: category.category,
        field: change.change.field,
        changeType: change.change.changeType,
        originalValue: change.change.doc1Value || '',
        amendedValue: change.change.doc2Value || '',
        impact: change.change.impact,
        riskScore: change.riskScore ? String(change.riskScore.severityScore) : '',
        riskSeverity: change.riskScore?.severity || '',
        favoredParty: change.riskScore?.favoredParty || '',
        reviewStatus: change.annotation ? REVIEW_STATUS_CONFIG[change.annotation.reviewStatus].label : '',
        commentCount: change.annotation ? String(change.annotation.comments.length) : '0',
      });
    }
  }

  sheets.push({
    name: 'Changes',
    columns: [
      { header: 'Category', key: 'category', width: 20 },
      { header: 'Field', key: 'field', width: 30 },
      { header: 'Change Type', key: 'changeType', width: 12 },
      { header: 'Original Value', key: 'originalValue', width: 25 },
      { header: 'Amended Value', key: 'amendedValue', width: 25 },
      { header: 'Impact', key: 'impact', width: 40 },
      { header: 'Risk Score', key: 'riskScore', width: 12 },
      { header: 'Severity', key: 'riskSeverity', width: 12 },
      { header: 'Favored Party', key: 'favoredParty', width: 15 },
      { header: 'Review Status', key: 'reviewStatus', width: 18 },
      { header: 'Comments', key: 'commentCount', width: 10 },
    ],
    rows: changesRows,
  });

  // Annotations sheet
  const annotationRows: Record<string, string>[] = [];
  for (const category of data.categories) {
    for (const change of category.changes) {
      if (change.annotation) {
        annotationRows.push({
          category: category.category,
          field: change.change.field,
          status: REVIEW_STATUS_CONFIG[change.annotation.reviewStatus].label,
          createdBy: change.annotation.createdBy.name,
          createdAt: new Date(change.annotation.createdAt).toLocaleDateString(),
          updatedAt: new Date(change.annotation.updatedAt).toLocaleDateString(),
          commentCount: String(change.annotation.comments.length),
        });
      }
    }
  }

  sheets.push({
    name: 'Annotations',
    columns: [
      { header: 'Category', key: 'category', width: 20 },
      { header: 'Field', key: 'field', width: 30 },
      { header: 'Status', key: 'status', width: 20 },
      { header: 'Created By', key: 'createdBy', width: 20 },
      { header: 'Created At', key: 'createdAt', width: 15 },
      { header: 'Updated At', key: 'updatedAt', width: 15 },
      { header: 'Comments', key: 'commentCount', width: 10 },
    ],
    rows: annotationRows,
  });

  // Comments sheet
  const commentRows: Record<string, string>[] = [];
  for (const category of data.categories) {
    for (const change of category.changes) {
      if (change.annotation) {
        for (const comment of change.annotation.comments) {
          commentRows.push({
            category: category.category,
            field: change.change.field,
            author: comment.author.name,
            authorEmail: comment.author.email,
            content: comment.content,
            mentions: comment.mentions.map((m) => m.userName).join(', '),
            createdAt: new Date(comment.createdAt).toLocaleString(),
            isEdited: comment.isEdited ? 'Yes' : 'No',
          });
        }
      }
    }
  }

  sheets.push({
    name: 'Comments',
    columns: [
      { header: 'Category', key: 'category', width: 20 },
      { header: 'Field', key: 'field', width: 30 },
      { header: 'Author', key: 'author', width: 20 },
      { header: 'Email', key: 'authorEmail', width: 25 },
      { header: 'Content', key: 'content', width: 50 },
      { header: 'Mentions', key: 'mentions', width: 25 },
      { header: 'Date', key: 'createdAt', width: 18 },
      { header: 'Edited', key: 'isEdited', width: 8 },
    ],
    rows: commentRows,
  });

  // Market Benchmarks sheet (if available)
  const benchmarkRows: Record<string, string>[] = [];
  for (const category of data.categories) {
    for (const change of category.changes) {
      if (change.marketBenchmark) {
        benchmarkRows.push({
          category: category.category,
          field: change.change.field,
          currentValue: change.change.doc2Value || change.change.doc1Value || '',
          marketLow: change.marketBenchmark.marketRangeLow,
          marketHigh: change.marketBenchmark.marketRangeHigh,
          marketMedian: change.marketBenchmark.marketMedian,
          position: change.marketBenchmark.marketPosition.replace('_', ' '),
          percentile: String(change.marketBenchmark.percentile),
        });
      }
    }
  }

  if (benchmarkRows.length > 0) {
    sheets.push({
      name: 'Market Benchmarks',
      columns: [
        { header: 'Category', key: 'category', width: 20 },
        { header: 'Field', key: 'field', width: 30 },
        { header: 'Current Value', key: 'currentValue', width: 20 },
        { header: 'Market Low', key: 'marketLow', width: 15 },
        { header: 'Market High', key: 'marketHigh', width: 15 },
        { header: 'Market Median', key: 'marketMedian', width: 15 },
        { header: 'Position', key: 'position', width: 15 },
        { header: 'Percentile', key: 'percentile', width: 12 },
      ],
      rows: benchmarkRows,
    });
  }

  // Audit Trail sheet (if available)
  if (data.auditTrail && data.auditTrail.length > 0) {
    sheets.push({
      name: 'Audit Trail',
      columns: [
        { header: 'Timestamp', key: 'timestamp', width: 20 },
        { header: 'User', key: 'user', width: 20 },
        { header: 'Email', key: 'email', width: 25 },
        { header: 'Action', key: 'action', width: 20 },
        { header: 'Description', key: 'description', width: 40 },
        { header: 'Change ID', key: 'changeId', width: 30 },
        { header: 'Previous Value', key: 'previousValue', width: 20 },
        { header: 'New Value', key: 'newValue', width: 20 },
      ],
      rows: data.auditTrail.map((entry) => ({
        timestamp: new Date(entry.timestamp).toLocaleString(),
        user: entry.user.name,
        email: entry.user.email,
        action: entry.action.replace('_', ' '),
        description: entry.description,
        changeId: entry.changeId || '',
        previousValue: entry.previousValue || '',
        newValue: entry.newValue || '',
      })),
    });
  }

  return {
    filename: data.config.filename,
    sheets,
  };
}

// ============================================
// Word (DOCX) Generator
// ============================================

/**
 * Generate Word document structure
 * In production, this would use a library like docx
 */
export function generateDocxContent(data: ExportData): DocxDocumentStructure {
  const sections: DocxSection[] = [];
  const includedSections = data.config.sections
    .filter((s) => s.included)
    .sort((a, b) => a.order - b.order);

  // Title page
  sections.push({
    type: 'title',
    content: {
      title: 'Document Comparison Report',
      subtitle: `${data.metadata.document1.name} vs ${data.metadata.document2.name}`,
      date: new Date(data.metadata.exportedAt).toLocaleDateString(),
      author: data.metadata.exportedBy?.name,
    },
  });

  for (const sectionConfig of includedSections) {
    switch (sectionConfig.section) {
      case 'document_metadata':
        sections.push({
          type: 'heading',
          content: { text: 'Document Information', level: 1 },
        });
        sections.push({
          type: 'table',
          content: {
            rows: [
              ['Original Document', data.metadata.document1.name],
              ['Amended Document', data.metadata.document2.name],
              ['Comparison Date', new Date(data.metadata.comparedAt).toLocaleDateString()],
              ['Export Date', new Date(data.metadata.exportedAt).toLocaleDateString()],
            ],
          },
        });
        break;

      case 'executive_summary':
        if (data.executiveSummary) {
          sections.push({
            type: 'heading',
            content: { text: 'Executive Summary', level: 1 },
          });
          sections.push({
            type: 'paragraph',
            content: { text: data.executiveSummary },
          });
          if (data.riskAnalysisSummary?.keyFindings) {
            sections.push({
              type: 'heading',
              content: { text: 'Key Findings', level: 2 },
            });
            sections.push({
              type: 'list',
              content: { items: data.riskAnalysisSummary.keyFindings },
            });
          }
        }
        break;

      case 'changes_by_category':
        sections.push({
          type: 'heading',
          content: { text: 'Detailed Changes', level: 1 },
        });
        for (const category of data.categories) {
          sections.push({
            type: 'heading',
            content: { text: category.category, level: 2 },
          });
          for (const change of category.changes) {
            sections.push({
              type: 'change',
              content: {
                field: change.change.field,
                changeType: change.change.changeType,
                oldValue: change.change.doc1Value,
                newValue: change.change.doc2Value,
                impact: change.change.impact,
                riskScore: change.riskScore,
                reviewStatus: change.annotation?.reviewStatus,
              },
            });
            // Include comments if present
            if (change.annotation?.comments.length) {
              for (const comment of change.annotation.comments) {
                sections.push({
                  type: 'comment',
                  content: {
                    author: comment.author.name,
                    date: new Date(comment.createdAt).toLocaleDateString(),
                    text: comment.content,
                  },
                });
              }
            }
          }
        }
        break;

      case 'impact_analysis':
        sections.push({
          type: 'heading',
          content: { text: 'Impact Analysis', level: 1 },
        });
        sections.push({
          type: 'paragraph',
          content: { text: data.impactAnalysis },
        });
        break;
    }
  }

  return {
    filename: data.config.filename,
    styling: data.config.styling,
    sections,
    header: data.config.styling.includeLogo ? {
      logoUrl: data.config.styling.logoUrl,
    } : undefined,
    footer: {
      pageNumbers: data.config.styling.includePageNumbers,
      generatedAt: data.metadata.exportedAt,
    },
    watermark: data.config.styling.includeWatermark ? data.config.styling.watermarkText : undefined,
  };
}

// ============================================
// Type Definitions for Generated Content
// ============================================

export interface PDFDocumentStructure {
  title: string;
  subtitle: string;
  styling: ExportData['config']['styling'];
  sections: PDFSection[];
  footer: {
    generatedAt: string;
    generatedBy?: string;
  };
}

export interface PDFSection {
  title: string;
  type: 'metadata' | 'text' | 'statistics' | 'risk' | 'table' | 'changes' | 'comments' | 'empty';
  content: Record<string, unknown>;
}

export interface ExcelWorkbookStructure {
  filename: string;
  sheets: ExcelSheet[];
}

export interface ExcelSheet {
  name: string;
  columns: Array<{ header: string; key: string; width: number }>;
  rows: Array<Record<string, string>>;
}

export interface DocxDocumentStructure {
  filename: string;
  styling: ExportData['config']['styling'];
  sections: DocxSection[];
  header?: {
    logoUrl?: string;
  };
  footer: {
    pageNumbers: boolean;
    generatedAt: string;
  };
  watermark?: string;
}

export interface DocxSection {
  type: 'title' | 'heading' | 'paragraph' | 'table' | 'list' | 'change' | 'comment';
  content: Record<string, unknown>;
}
