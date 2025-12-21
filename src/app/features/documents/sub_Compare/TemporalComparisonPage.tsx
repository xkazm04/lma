'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ArrowLeft, FileText, AlertCircle, Clock, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { DocumentEvolutionTimeline } from './components/DocumentEvolutionTimeline';
import { ComparisonCategorySection } from './components/ComparisonCategorySection';
import { useDocumentTimeline } from './hooks/useDocumentTimeline';
import type { DocumentState } from './lib/temporal-types';

interface TemporalComparisonPageProps {
  facilityId?: string;
  documentId?: string;
}

// Mock data for facilities (would come from API in production)
const mockFacilities = [
  { id: 'fac-1', name: 'Acme Corp Revolving Credit Facility', borrower: 'Acme Corporation' },
  { id: 'fac-2', name: 'TechStart Term Loan A', borrower: 'TechStart Inc.' },
  { id: 'fac-3', name: 'Global Industries Bridge Facility', borrower: 'Global Industries Ltd.' },
];

export function TemporalComparisonPage({
  facilityId: propFacilityId,
  documentId: propDocumentId,
}: TemporalComparisonPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get IDs from props or URL
  const facilityId = propFacilityId || searchParams.get('facilityId') || undefined;
  const documentId = propDocumentId || searchParams.get('documentId') || undefined;

  const [selectedFacilityId, setSelectedFacilityId] = useState<string | undefined>(facilityId);

  const {
    timeline,
    visualPoints,
    isLoading,
    error,
    selectedFromState,
    selectedToState,
    comparisonResult,
    isComparing,
    comparisonError,
    fetchTimeline,
    selectFromState,
    selectToState,
    clearSelection,
    compareStates,
  } = useDocumentTimeline({
    facilityId: selectedFacilityId,
    documentId,
    autoFetch: !!(selectedFacilityId || documentId),
  });

  // Update selected facility when URL changes
  useEffect(() => {
    if (facilityId && facilityId !== selectedFacilityId) {
      setSelectedFacilityId(facilityId);
    }
  }, [facilityId, selectedFacilityId]);

  const handleFacilityChange = (newFacilityId: string) => {
    setSelectedFacilityId(newFacilityId);
    clearSelection();
    // Update URL
    router.push(`/documents/evolution?facilityId=${newFacilityId}`);
  };

  const handleCompare = (from: DocumentState, to: DocumentState) => {
    compareStates(from, to);
  };

  const handleBackClick = () => {
    router.push('/documents/compare');
  };

  // Group differences by category for display
  const groupedDifferences = comparisonResult?.differences?.reduce((acc, diff) => {
    const category = diff.category || 'Other';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push({
      field: diff.field,
      doc1Value: diff.document1Value,
      doc2Value: diff.document2Value,
      changeType: diff.changeType,
    });
    return acc;
  }, {} as Record<string, Array<{
    field: string;
    doc1Value: unknown;
    doc2Value: unknown;
    changeType: 'added' | 'removed' | 'modified';
  }>>);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleBackClick}
            data-testid="back-to-compare-btn"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-zinc-900">Document Evolution</h1>
            <p className="text-sm text-zinc-500">
              Track how your loan facility documents changed over time
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Select
            value={selectedFacilityId || ''}
            onValueChange={handleFacilityChange}
          >
            <SelectTrigger className="w-[300px]" data-testid="facility-selector">
              <SelectValue placeholder="Select a facility" />
            </SelectTrigger>
            <SelectContent>
              {mockFacilities.map((facility) => (
                <SelectItem key={facility.id} value={facility.id}>
                  <div className="flex flex-col">
                    <span className="font-medium">{facility.name}</span>
                    <span className="text-xs text-zinc-500">{facility.borrower}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="icon"
            onClick={() => fetchTimeline()}
            disabled={isLoading || (!selectedFacilityId && !documentId)}
            data-testid="refresh-timeline-btn"
          >
            <RefreshCw className={cn('w-4 h-4', isLoading && 'animate-spin')} />
          </Button>
        </div>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="space-y-4" data-testid="loading-state">
          <Skeleton className="h-64 w-full rounded-lg" />
          <div className="grid grid-cols-4 gap-4">
            <Skeleton className="h-24 w-full rounded-lg" />
            <Skeleton className="h-24 w-full rounded-lg" />
            <Skeleton className="h-24 w-full rounded-lg" />
            <Skeleton className="h-24 w-full rounded-lg" />
          </div>
        </div>
      )}

      {/* Error state */}
      {error && !isLoading && (
        <Card className="border-red-200 bg-red-50" data-testid="error-state">
          <CardContent className="py-6">
            <div className="flex items-center gap-3 text-red-700">
              <AlertCircle className="w-5 h-5" />
              <div>
                <p className="font-medium">Error loading timeline</p>
                <p className="text-sm text-red-600">{error}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* No facility selected state */}
      {!selectedFacilityId && !documentId && !isLoading && (
        <Card data-testid="no-facility-state">
          <CardContent className="py-12 text-center">
            <FileText className="w-12 h-12 mx-auto text-zinc-300 mb-4" />
            <h3 className="text-lg font-medium text-zinc-700 mb-2">
              Select a Facility
            </h3>
            <p className="text-sm text-zinc-500 max-w-md mx-auto">
              Choose a loan facility from the dropdown above to view its document evolution timeline.
              You&apos;ll be able to see how terms and covenants changed across amendments.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Timeline */}
      {timeline && !isLoading && (
        <DocumentEvolutionTimeline
          timeline={timeline}
          visualPoints={visualPoints}
          selectedFromState={selectedFromState}
          selectedToState={selectedToState}
          comparisonResult={comparisonResult}
          onSelectFromState={selectFromState}
          onSelectToState={selectToState}
          onCompare={handleCompare}
          isLoading={isComparing}
        />
      )}

      {/* Comparison error */}
      {comparisonError && (
        <Card className="border-amber-200 bg-amber-50" data-testid="comparison-error">
          <CardContent className="py-4">
            <div className="flex items-center gap-3 text-amber-700">
              <AlertCircle className="w-5 h-5" />
              <p className="text-sm">{comparisonError}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Full comparison details */}
      {comparisonResult && groupedDifferences && Object.keys(groupedDifferences).length > 0 && (
        <div className="space-y-4" data-testid="comparison-details">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Detailed Changes
                </CardTitle>
                <Badge variant="secondary">
                  {comparisonResult.differences.length} total changes
                </Badge>
              </div>
              <p className="text-sm text-zinc-500">
                Comparing {comparisonResult.fromState?.name} to {comparisonResult.toState?.name}
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(groupedDifferences).map(([category, changes]) => (
                <ComparisonCategorySection
                  key={category}
                  category={{
                    category: category,
                    changes: changes.map(change => ({
                      field: change.field,
                      doc1Value: change.doc1Value as string | null,
                      doc2Value: change.doc2Value as string | null,
                      changeType: change.changeType,
                      impact: '',
                    })),
                  }}
                />
              ))}
            </CardContent>
          </Card>

          {/* Impact Analysis */}
          {comparisonResult.impactAnalysis && (
            <Card data-testid="impact-analysis">
              <CardHeader>
                <CardTitle className="text-lg">Impact Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-zinc-700">{comparisonResult.impactAnalysis}</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* No changes state */}
      {comparisonResult && comparisonResult.differences.length === 0 && (
        <Card data-testid="no-changes-state">
          <CardContent className="py-8 text-center">
            <FileText className="w-10 h-10 mx-auto text-zinc-300 mb-3" />
            <h3 className="text-lg font-medium text-zinc-700 mb-1">
              No Differences Found
            </h3>
            <p className="text-sm text-zinc-500">
              The selected document versions appear to have identical terms.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default TemporalComparisonPage;
