// Mock data for PDF overlay feature
// Maps comparison changes to PDF page regions

import type { PDFChangeRegion, PDFDocumentInfo } from './pdf-overlay-types';

/**
 * Mock PDF document information
 */
export const mockPDFDocuments: Record<string, PDFDocumentInfo> = {
  'doc-1': {
    id: 'doc-1',
    filename: 'Apollo_Credit_Fund_Original_Agreement.pdf',
    totalPages: 45,
    fileSize: 2_456_000,
    uploadedAt: '2024-11-15T10:30:00Z',
  },
  'doc-2': {
    id: 'doc-2',
    filename: 'Apollo_Credit_Fund_First_Amendment.pdf',
    totalPages: 12,
    fileSize: 1_234_000,
    uploadedAt: '2024-12-06T14:20:00Z',
  },
};

/**
 * Mock change regions mapped to PDF pages
 * These coordinates correspond to the mock comparison result changes
 */
export const mockChangeRegions: PDFChangeRegion[] = [
  // Financial Terms
  {
    changeId: 'financial-terms-total-commitments',
    fieldName: 'Total Commitments',
    category: 'Financial Terms',
    changeType: 'modified',
    doc1Region: {
      id: 'region-1a',
      page: 3,
      x: 12,
      y: 25,
      width: 76,
      height: 8,
    },
    doc2Region: {
      id: 'region-1b',
      page: 2,
      x: 12,
      y: 18,
      width: 76,
      height: 8,
    },
    severity: 'high',
    description: 'Facility size increased by $50M',
  },
  {
    changeId: 'financial-terms-initial-margin',
    fieldName: 'Initial Margin',
    category: 'Financial Terms',
    changeType: 'modified',
    doc1Region: {
      id: 'region-2a',
      page: 5,
      x: 10,
      y: 42,
      width: 80,
      height: 6,
    },
    doc2Region: {
      id: 'region-2b',
      page: 3,
      x: 10,
      y: 35,
      width: 80,
      height: 6,
    },
    severity: 'medium',
    description: 'Margin reduced by 25bps',
  },
  {
    changeId: 'financial-terms-commitment-fee',
    fieldName: 'Commitment Fee',
    category: 'Financial Terms',
    changeType: 'modified',
    doc1Region: {
      id: 'region-3a',
      page: 5,
      x: 10,
      y: 55,
      width: 75,
      height: 5,
    },
    doc2Region: {
      id: 'region-3b',
      page: 3,
      x: 10,
      y: 48,
      width: 75,
      height: 5,
    },
    severity: 'low',
    description: 'Fee increased from 0.50% to 0.625%',
  },
  // Key Dates
  {
    changeId: 'key-dates-maturity-date',
    fieldName: 'Maturity Date',
    category: 'Key Dates',
    changeType: 'modified',
    doc1Region: {
      id: 'region-4a',
      page: 2,
      x: 15,
      y: 62,
      width: 70,
      height: 5,
    },
    doc2Region: {
      id: 'region-4b',
      page: 2,
      x: 15,
      y: 55,
      width: 70,
      height: 5,
    },
    severity: 'medium',
    description: 'Extended by 2 years',
  },
  {
    changeId: 'key-dates-availability-period',
    fieldName: 'Availability Period',
    category: 'Key Dates',
    changeType: 'modified',
    doc1Region: {
      id: 'region-5a',
      page: 4,
      x: 12,
      y: 28,
      width: 76,
      height: 6,
    },
    doc2Region: {
      id: 'region-5b',
      page: 2,
      x: 12,
      y: 68,
      width: 76,
      height: 6,
    },
    severity: 'low',
    description: 'Extended availability period',
  },
  // Covenants
  {
    changeId: 'covenants-maximum-leverage-ratio',
    fieldName: 'Maximum Leverage Ratio',
    category: 'Covenants',
    changeType: 'modified',
    doc1Region: {
      id: 'region-6a',
      page: 18,
      x: 8,
      y: 35,
      width: 84,
      height: 10,
    },
    doc2Region: {
      id: 'region-6b',
      page: 5,
      x: 8,
      y: 22,
      width: 84,
      height: 10,
    },
    severity: 'critical',
    description: 'Leverage covenant loosened from 4.5x to 5.0x',
  },
  {
    changeId: 'covenants-minimum-interest-coverage',
    fieldName: 'Minimum Interest Coverage',
    category: 'Covenants',
    changeType: 'modified',
    doc1Region: {
      id: 'region-7a',
      page: 18,
      x: 8,
      y: 48,
      width: 84,
      height: 8,
    },
    doc2Region: {
      id: 'region-7b',
      page: 5,
      x: 8,
      y: 38,
      width: 84,
      height: 8,
    },
    severity: 'high',
    description: 'Coverage requirement reduced',
  },
  {
    changeId: 'covenants-capex-limitation',
    fieldName: 'CapEx Limitation',
    category: 'Covenants',
    changeType: 'added',
    doc1Region: null,
    doc2Region: {
      id: 'region-8b',
      page: 6,
      x: 8,
      y: 15,
      width: 84,
      height: 12,
    },
    severity: 'medium',
    description: 'New CapEx restriction added',
  },
  // Parties
  {
    changeId: 'parties-lender:-pacific-capital',
    fieldName: 'Lender: Pacific Capital',
    category: 'Parties',
    changeType: 'added',
    doc1Region: null,
    doc2Region: {
      id: 'region-9b',
      page: 1,
      x: 10,
      y: 72,
      width: 80,
      height: 6,
    },
    severity: 'low',
    description: 'New lender added to syndicate',
  },
  {
    changeId: 'parties-lender:-first-national',
    fieldName: 'Lender: First National',
    category: 'Parties',
    changeType: 'removed',
    doc1Region: {
      id: 'region-10a',
      page: 1,
      x: 10,
      y: 68,
      width: 80,
      height: 6,
    },
    doc2Region: null,
    severity: 'medium',
    description: 'Lender exited syndicate',
  },
];

/**
 * Generate mock PDF page URLs for a document
 * In production, these would be actual PDF page renders
 */
export function getMockPDFPageUrl(documentId: string, pageNumber: number): string {
  // Return a placeholder that indicates this would be a PDF page
  return `/api/documents/${documentId}/pages/${pageNumber}`;
}

/**
 * Get change regions for a specific page
 */
export function getChangeRegionsForPage(
  documentSide: 'doc1' | 'doc2',
  pageNumber: number
): PDFChangeRegion[] {
  return mockChangeRegions.filter((region) => {
    const regionData = documentSide === 'doc1' ? region.doc1Region : region.doc2Region;
    return regionData?.page === pageNumber;
  });
}

/**
 * Get all pages that have changes for a document
 */
export function getPagesWithChanges(documentSide: 'doc1' | 'doc2'): number[] {
  const pages = new Set<number>();
  mockChangeRegions.forEach((region) => {
    const regionData = documentSide === 'doc1' ? region.doc1Region : region.doc2Region;
    if (regionData) {
      pages.add(regionData.page);
    }
  });
  return Array.from(pages).sort((a, b) => a - b);
}

/**
 * Get paired pages that should be shown together
 * When a change exists on page X in doc1, shows corresponding page in doc2
 */
export function getPairedPages(): Array<{ doc1Page: number; doc2Page: number; changes: PDFChangeRegion[] }> {
  const pairs = new Map<string, { doc1Page: number; doc2Page: number; changes: PDFChangeRegion[] }>();

  mockChangeRegions.forEach((region) => {
    const doc1Page = region.doc1Region?.page ?? 0;
    const doc2Page = region.doc2Region?.page ?? 0;
    const key = `${doc1Page}-${doc2Page}`;

    if (!pairs.has(key)) {
      pairs.set(key, { doc1Page, doc2Page, changes: [] });
    }
    pairs.get(key)!.changes.push(region);
  });

  return Array.from(pairs.values()).sort((a, b) => {
    // Sort by doc1 page first, then doc2 page
    if (a.doc1Page !== b.doc1Page) return a.doc1Page - b.doc1Page;
    return a.doc2Page - b.doc2Page;
  });
}
