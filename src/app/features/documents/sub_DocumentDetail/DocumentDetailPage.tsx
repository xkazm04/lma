'use client';

import React, { useState, useCallback } from 'react';
import Link from 'next/link';
import { ArrowLeft, Download, RefreshCw, FileCheck, CheckCircle, Search, Shield, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatDate, formatFileSize } from '@/lib/utils';
import { Confidence } from '@/components/ui/confidence';
import {
  FacilityDetailsTab,
  CovenantsTab,
  ObligationsTab,
  PartiesTab,
  SimilarityTab,
  CovenantExtractionReview,
  RiskSimulationTab,
} from './components';
import { mockDocument, mockCovenants, mockObligations } from './lib/mock-data';
import type { CovenantExtractionResult } from '@/lib/llm/covenant-extraction';

interface DocumentDetailPageProps {
  documentId: string;
}

// Mock compliance facilities for demo
const mockComplianceFacilities = [
  { id: 'fac-001', name: 'Project Apollo Term Loan', borrowerName: 'Apollo Holdings Inc.' },
  { id: 'fac-002', name: 'Global Enterprises Revolver', borrowerName: 'Global Enterprises LLC' },
  { id: 'fac-003', name: 'Tech Corp Credit Facility', borrowerName: 'Tech Corp' },
];

export function DocumentDetailPage({ documentId }: DocumentDetailPageProps) {
  const [covenantExtraction, setCovenantExtraction] = useState<CovenantExtractionResult | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionSuccess, setExtractionSuccess] = useState<{ count: number; facilityName: string } | null>(null);

  const handleExtractCovenants = useCallback(async () => {
    setIsExtracting(true);
    try {
      const response = await fetch(`/api/documents/${documentId}/extract-covenants`, {
        method: 'POST',
      });
      const result = await response.json();
      if (result.success && result.data?.extraction) {
        setCovenantExtraction(result.data.extraction);
      }
    } catch (error) {
      console.error('Failed to extract covenants:', error);
    } finally {
      setIsExtracting(false);
    }
  }, [documentId]);

  const handleConfirmCovenants = useCallback(async (
    covenants: Array<{
      extracted: unknown;
      status: 'pending' | 'confirmed' | 'modified' | 'rejected';
      modifications?: unknown;
    }>,
    facilityId: string
  ) => {
    try {
      const response = await fetch(`/api/documents/${documentId}/extract-covenants`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ facilityId, covenants }),
      });
      const result = await response.json();
      if (result.success) {
        const facility = mockComplianceFacilities.find(f => f.id === facilityId);
        setExtractionSuccess({
          count: result.data.createdCovenants,
          facilityName: facility?.name || 'Unknown Facility',
        });
        // Reset extraction after successful import
        setTimeout(() => {
          setCovenantExtraction(null);
          setExtractionSuccess(null);
        }, 3000);
      }
    } catch (error) {
      console.error('Failed to confirm covenants:', error);
    }
  }, [documentId]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-start justify-between animate-in fade-in slide-in-from-top-4 duration-500">
        <div className="flex items-start gap-4">
          <Link href="/documents" data-testid="back-to-documents-link">
            <Button variant="ghost" size="icon" className="transition-transform hover:scale-110" data-testid="back-to-documents-btn">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-zinc-900">
                {mockDocument.original_filename}
              </h1>
              <Badge variant="success">Completed</Badge>
            </div>
            <p className="text-zinc-500 mt-1">
              Uploaded {formatDate(mockDocument.uploaded_at)} • {mockDocument.page_count} pages •{' '}
              {formatFileSize(mockDocument.file_size)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="transition-transform hover:scale-105" data-testid="download-document-btn">
            <Download className="w-4 h-4 mr-2" />
            Download
          </Button>
          <Button variant="outline" className="transition-transform hover:scale-105" data-testid="reprocess-document-btn">
            <RefreshCw className="w-4 h-4 mr-2" />
            Reprocess
          </Button>
          <Link href={`/documents/${documentId}/extraction`} data-testid="review-extraction-link">
            <Button className="transition-transform hover:scale-105" data-testid="review-extraction-btn">
              <FileCheck className="w-4 h-4 mr-2" />
              Review Extraction
            </Button>
          </Link>
        </div>
      </div>

      {/* Extraction Summary */}
      <Card className="animate-in fade-in slide-in-from-top-2 duration-300">
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="font-medium">Extraction Complete</span>
              </div>
              <Confidence value={mockDocument.extraction_confidence} variant="badge" />
            </div>
            <div className="flex items-center gap-4 text-sm text-zinc-500">
              <span>1 Facility</span>
              <span className="text-zinc-300">•</span>
              <span>{mockCovenants.length} Covenants</span>
              <span className="text-zinc-300">•</span>
              <span>{mockObligations.length} Obligations</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Success Message */}
      {extractionSuccess && (
        <Card className="border-green-200 bg-green-50 animate-in fade-in slide-in-from-top-2">
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="font-medium text-green-700">
                Successfully imported {extractionSuccess.count} covenants to {extractionSuccess.facilityName}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content Tabs */}
      <Tabs defaultValue="facility" className="animate-in fade-in duration-300" data-testid="document-detail-tabs">
        <TabsList data-testid="document-tabs-list">
          <TabsTrigger value="facility" data-testid="facility-tab">Facility Details</TabsTrigger>
          <TabsTrigger value="covenants" data-testid="covenants-tab">Covenants ({mockCovenants.length})</TabsTrigger>
          <TabsTrigger value="obligations" data-testid="obligations-tab">Obligations ({mockObligations.length})</TabsTrigger>
          <TabsTrigger value="parties" data-testid="parties-tab">Parties</TabsTrigger>
          <TabsTrigger value="similarity" data-testid="similarity-tab" className="flex items-center gap-1">
            <Search className="w-3.5 h-3.5" />
            Similarity
          </TabsTrigger>
          <TabsTrigger value="extract-compliance" data-testid="extract-compliance-tab" className="flex items-center gap-1">
            <Shield className="w-3.5 h-3.5" />
            Extract for Compliance
          </TabsTrigger>
          <TabsTrigger value="risk-simulation" data-testid="risk-simulation-tab" className="flex items-center gap-1">
            <Zap className="w-3.5 h-3.5" />
            Risk Simulation
          </TabsTrigger>
        </TabsList>

        <TabsContent value="facility" className="space-y-6" data-testid="facility-tab-content">
          <FacilityDetailsTab />
        </TabsContent>

        <TabsContent value="covenants" className="space-y-4" data-testid="covenants-tab-content">
          <CovenantsTab />
        </TabsContent>

        <TabsContent value="obligations" className="space-y-4" data-testid="obligations-tab-content">
          <ObligationsTab />
        </TabsContent>

        <TabsContent value="parties" className="space-y-6" data-testid="parties-tab-content">
          <PartiesTab />
        </TabsContent>

        <TabsContent value="similarity" className="space-y-6" data-testid="similarity-tab-content">
          <SimilarityTab documentId={documentId} />
        </TabsContent>

        <TabsContent value="extract-compliance" className="space-y-6" data-testid="extract-compliance-tab-content">
          <CovenantExtractionReview
            extraction={covenantExtraction}
            isLoading={isExtracting}
            onExtract={handleExtractCovenants}
            onConfirm={handleConfirmCovenants}
            facilities={mockComplianceFacilities}
          />
        </TabsContent>

        <TabsContent value="risk-simulation" className="space-y-6" data-testid="risk-simulation-tab-content">
          <RiskSimulationTab documentId={documentId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
