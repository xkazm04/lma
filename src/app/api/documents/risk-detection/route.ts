import { NextRequest, NextResponse } from 'next/server';
import {
  generateMockRiskAlerts,
  generateMockRiskStats,
  generateMockScanResponse,
} from '@/lib/llm/risk-detection';
import type {
  RiskAlert,
  RiskAlertFilters,
  RiskAlertsResponse,
  RiskAlertStatus,
  RiskScanRequest,
  RiskScanResponse,
} from '@/app/features/documents/lib/types';

// In-memory store for development (would be database in production)
// eslint-disable-next-line prefer-const -- array is mutated in PATCH handler
let mockAlerts = generateMockRiskAlerts();

/**
 * GET /api/documents/risk-detection
 * Retrieve risk alerts with filtering, sorting, and pagination
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  // Parse filter parameters
  const filters: RiskAlertFilters = {
    severity: searchParams.get('severity')?.split(',') as RiskAlertFilters['severity'],
    category: searchParams.get('category')?.split(',') as RiskAlertFilters['category'],
    status: searchParams.get('status')?.split(',') as RiskAlertFilters['status'],
    documentId: searchParams.get('documentId') || undefined,
    dateFrom: searchParams.get('dateFrom') || undefined,
    dateTo: searchParams.get('dateTo') || undefined,
    searchQuery: searchParams.get('search') || undefined,
    sortBy: (searchParams.get('sortBy') as RiskAlertFilters['sortBy']) || 'severity',
    sortDirection: (searchParams.get('sortDirection') as RiskAlertFilters['sortDirection']) || 'desc',
  };

  const page = parseInt(searchParams.get('page') || '1', 10);
  const pageSize = parseInt(searchParams.get('pageSize') || '20', 10);

  // Apply filters
  let filteredAlerts = [...mockAlerts];

  if (filters.severity?.length) {
    filteredAlerts = filteredAlerts.filter((a) => filters.severity!.includes(a.severity));
  }

  if (filters.category?.length) {
    filteredAlerts = filteredAlerts.filter((a) => filters.category!.includes(a.category));
  }

  if (filters.status?.length) {
    filteredAlerts = filteredAlerts.filter((a) => filters.status!.includes(a.status));
  }

  if (filters.documentId) {
    filteredAlerts = filteredAlerts.filter((a) => a.documentId === filters.documentId);
  }

  if (filters.dateFrom) {
    filteredAlerts = filteredAlerts.filter((a) => a.createdAt >= filters.dateFrom!);
  }

  if (filters.dateTo) {
    filteredAlerts = filteredAlerts.filter((a) => a.createdAt <= filters.dateTo!);
  }

  if (filters.searchQuery) {
    const query = filters.searchQuery.toLowerCase();
    filteredAlerts = filteredAlerts.filter(
      (a) =>
        a.title.toLowerCase().includes(query) ||
        a.description.toLowerCase().includes(query) ||
        a.documentName.toLowerCase().includes(query)
    );
  }

  // Apply sorting
  const severityOrder = { critical: 5, high: 4, medium: 3, low: 2, info: 1 };
  filteredAlerts.sort((a, b) => {
    let comparison = 0;
    switch (filters.sortBy) {
      case 'severity':
        comparison = severityOrder[a.severity] - severityOrder[b.severity];
        break;
      case 'createdAt':
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        break;
      case 'documentName':
        comparison = a.documentName.localeCompare(b.documentName);
        break;
      case 'category':
        comparison = a.category.localeCompare(b.category);
        break;
      default:
        comparison = severityOrder[a.severity] - severityOrder[b.severity];
    }
    return filters.sortDirection === 'asc' ? comparison : -comparison;
  });

  // Apply pagination
  const total = filteredAlerts.length;
  const startIndex = (page - 1) * pageSize;
  const paginatedAlerts = filteredAlerts.slice(startIndex, startIndex + pageSize);

  // Generate stats
  const stats = generateMockRiskStats();

  const response: RiskAlertsResponse = {
    alerts: paginatedAlerts,
    total,
    page,
    pageSize,
    stats,
  };

  return NextResponse.json(response);
}

/**
 * POST /api/documents/risk-detection
 * Trigger a new risk scan for documents
 */
export async function POST(request: NextRequest) {
  const body: RiskScanRequest = await request.json();

  // Simulate processing time
  await new Promise((resolve) => setTimeout(resolve, 500));

  // Generate mock scan response
  const scanResponse = generateMockScanResponse();

  // In production, this would:
  // 1. Queue documents for scanning
  // 2. Return scan ID for tracking progress
  // 3. Process documents asynchronously
  // 4. Store results in database

  return NextResponse.json(scanResponse);
}

/**
 * PATCH /api/documents/risk-detection
 * Update alert status (acknowledge, resolve, mark as false positive)
 */
export async function PATCH(request: NextRequest) {
  const body: {
    alertId: string;
    status: RiskAlertStatus;
    resolutionNotes?: string;
    resolvedBy?: string;
  } = await request.json();

  const alertIndex = mockAlerts.findIndex((a) => a.id === body.alertId);

  if (alertIndex === -1) {
    return NextResponse.json({ error: 'Alert not found' }, { status: 404 });
  }

  // Update the alert
  mockAlerts[alertIndex] = {
    ...mockAlerts[alertIndex],
    status: body.status,
    updatedAt: new Date().toISOString(),
    ...(body.resolutionNotes && { resolutionNotes: body.resolutionNotes }),
    ...(body.resolvedBy && { resolvedBy: body.resolvedBy }),
  };

  return NextResponse.json(mockAlerts[alertIndex]);
}
