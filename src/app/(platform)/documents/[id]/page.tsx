'use client';

import React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ArrowLeft,
  FileText,
  Download,
  RefreshCw,
  Trash2,
  ExternalLink,
  CheckCircle,
  AlertCircle,
  Calendar,
  Building2,
  Users,
  DollarSign,
  Percent,
  Scale,
  FileCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { formatDate, formatFileSize } from '@/lib/utils';

// Mock document data
const mockDocument = {
  id: '1',
  original_filename: 'Facility Agreement - Project Apollo.pdf',
  document_type: 'facility_agreement',
  processing_status: 'completed',
  uploaded_at: '2024-12-05T10:30:00Z',
  page_count: 245,
  file_size: 2500000,
  extraction_confidence: 0.92,
};

const mockFacility = {
  facility_name: 'Project Apollo Senior Secured Term Loan Facility',
  facility_reference: 'APOLLO-2024-001',
  execution_date: '2024-11-15',
  effective_date: '2024-11-20',
  maturity_date: '2029-11-20',
  facility_type: 'term',
  currency: 'USD',
  total_commitments: 500000000,
  interest_rate_type: 'floating',
  base_rate: 'SOFR',
  margin_initial: 3.25,
  governing_law: 'New York',
  syndicated: true,
  borrowers: [
    { name: 'Apollo Holdings Inc.', jurisdiction: 'Delaware', role: 'Borrower' },
  ],
  lenders: [
    { name: 'Global Bank NA', commitment_amount: 150000000, percentage: 30 },
    { name: 'European Credit AG', commitment_amount: 100000000, percentage: 20 },
    { name: 'Pacific Finance Ltd', commitment_amount: 100000000, percentage: 20 },
    { name: 'Regional Trust Bank', commitment_amount: 75000000, percentage: 15 },
    { name: 'Credit Union Partners', commitment_amount: 75000000, percentage: 15 },
  ],
  agents: [
    { name: 'Global Bank NA', role: 'Administrative Agent' },
    { name: 'European Credit AG', role: 'Documentation Agent' },
  ],
};

const mockCovenants = [
  {
    id: '1',
    covenant_type: 'leverage_ratio',
    covenant_name: 'Maximum Total Leverage Ratio',
    threshold_type: 'maximum',
    threshold_value: 4.5,
    testing_frequency: 'quarterly',
    clause_reference: 'Section 7.1(a)',
    confidence: 0.95,
  },
  {
    id: '2',
    covenant_type: 'interest_coverage',
    covenant_name: 'Minimum Interest Coverage Ratio',
    threshold_type: 'minimum',
    threshold_value: 3.0,
    testing_frequency: 'quarterly',
    clause_reference: 'Section 7.1(b)',
    confidence: 0.93,
  },
  {
    id: '3',
    covenant_type: 'capex_limit',
    covenant_name: 'Annual Capital Expenditure Limit',
    threshold_type: 'maximum',
    threshold_value: 50000000,
    testing_frequency: 'annual',
    clause_reference: 'Section 7.2',
    confidence: 0.88,
  },
];

const mockObligations = [
  {
    id: '1',
    obligation_type: 'annual_financials',
    description: 'Audited annual financial statements',
    frequency: 'annual',
    deadline_days: 90,
    recipient_role: 'Administrative Agent',
    clause_reference: 'Section 6.1(a)',
    confidence: 0.96,
  },
  {
    id: '2',
    obligation_type: 'quarterly_financials',
    description: 'Quarterly unaudited financial statements',
    frequency: 'quarterly',
    deadline_days: 45,
    recipient_role: 'Administrative Agent',
    clause_reference: 'Section 6.1(b)',
    confidence: 0.94,
  },
  {
    id: '3',
    obligation_type: 'compliance_certificate',
    description: 'Compliance certificate with covenant calculations',
    frequency: 'quarterly',
    deadline_days: 45,
    recipient_role: 'Administrative Agent',
    clause_reference: 'Section 6.2',
    confidence: 0.91,
  },
];

function ConfidenceBadge({ value }: { value: number }) {
  const percent = Math.round(value * 100);
  const variant = percent >= 90 ? 'success' : percent >= 70 ? 'warning' : 'destructive';
  return (
    <Badge variant={variant} className="text-xs">
      {percent}% confidence
    </Badge>
  );
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export default function DocumentDetailPage() {
  const params = useParams();
  const documentId = params.id as string;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <Link href="/documents">
            <Button variant="ghost" size="icon">
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
              Uploaded {formatDate(mockDocument.uploaded_at)} • {mockDocument.page_count} pages • {formatFileSize(mockDocument.file_size)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Download
          </Button>
          <Button variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Reprocess
          </Button>
          <Link href={`/documents/${documentId}/extraction`}>
            <Button>
              <FileCheck className="w-4 h-4 mr-2" />
              Review Extraction
            </Button>
          </Link>
        </div>
      </div>

      {/* Extraction Summary */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="font-medium">Extraction Complete</span>
              </div>
              <ConfidenceBadge value={mockDocument.extraction_confidence} />
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

      {/* Main Content Tabs */}
      <Tabs defaultValue="facility">
        <TabsList>
          <TabsTrigger value="facility">Facility Details</TabsTrigger>
          <TabsTrigger value="covenants">Covenants ({mockCovenants.length})</TabsTrigger>
          <TabsTrigger value="obligations">Obligations ({mockObligations.length})</TabsTrigger>
          <TabsTrigger value="parties">Parties</TabsTrigger>
        </TabsList>

        {/* Facility Details Tab */}
        <TabsContent value="facility" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-zinc-500">Facility Name</p>
                    <p className="font-medium">{mockFacility.facility_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-zinc-500">Reference</p>
                    <p className="font-medium">{mockFacility.facility_reference}</p>
                  </div>
                  <div>
                    <p className="text-sm text-zinc-500">Facility Type</p>
                    <p className="font-medium capitalize">{mockFacility.facility_type}</p>
                  </div>
                  <div>
                    <p className="text-sm text-zinc-500">Governing Law</p>
                    <p className="font-medium">{mockFacility.governing_law}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Key Dates */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Key Dates
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-zinc-500">Execution Date</p>
                    <p className="font-medium">{formatDate(mockFacility.execution_date)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-zinc-500">Effective Date</p>
                    <p className="font-medium">{formatDate(mockFacility.effective_date)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-zinc-500">Maturity Date</p>
                    <p className="font-medium">{formatDate(mockFacility.maturity_date)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-zinc-500">Tenor</p>
                    <p className="font-medium">5 years</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Financial Terms */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Financial Terms
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-zinc-500">Total Commitments</p>
                    <p className="font-medium text-xl">{formatCurrency(mockFacility.total_commitments)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-zinc-500">Currency</p>
                    <p className="font-medium">{mockFacility.currency}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Interest Terms */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Percent className="w-5 h-5" />
                  Interest Terms
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-zinc-500">Rate Type</p>
                    <p className="font-medium capitalize">{mockFacility.interest_rate_type}</p>
                  </div>
                  <div>
                    <p className="text-sm text-zinc-500">Base Rate</p>
                    <p className="font-medium">{mockFacility.base_rate}</p>
                  </div>
                  <div>
                    <p className="text-sm text-zinc-500">Initial Margin</p>
                    <p className="font-medium">{mockFacility.margin_initial}%</p>
                  </div>
                  <div>
                    <p className="text-sm text-zinc-500">All-in Rate</p>
                    <p className="font-medium">{mockFacility.base_rate} + {mockFacility.margin_initial}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Covenants Tab */}
        <TabsContent value="covenants" className="space-y-4">
          {mockCovenants.map((covenant) => (
            <Card key={covenant.id}>
              <CardContent className="py-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="p-2 rounded-lg bg-amber-100">
                      <Scale className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{covenant.covenant_name}</h3>
                        <ConfidenceBadge value={covenant.confidence} />
                      </div>
                      <p className="text-sm text-zinc-500 mt-1">
                        {covenant.threshold_type === 'maximum' ? 'Maximum' : 'Minimum'}: {
                          covenant.covenant_type === 'capex_limit'
                            ? formatCurrency(covenant.threshold_value)
                            : `${covenant.threshold_value}x`
                        }
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-zinc-400">
                        <span>Testing: {covenant.testing_frequency}</span>
                        <span className="text-zinc-300">•</span>
                        <span>{covenant.clause_reference}</span>
                      </div>
                    </div>
                  </div>
                  <Badge variant="outline" className="capitalize">
                    {covenant.covenant_type.replace(/_/g, ' ')}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Obligations Tab */}
        <TabsContent value="obligations" className="space-y-4">
          {mockObligations.map((obligation) => (
            <Card key={obligation.id}>
              <CardContent className="py-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="p-2 rounded-lg bg-blue-100">
                      <FileCheck className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{obligation.description}</h3>
                        <ConfidenceBadge value={obligation.confidence} />
                      </div>
                      <p className="text-sm text-zinc-500 mt-1">
                        Due within {obligation.deadline_days} days • To: {obligation.recipient_role}
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-zinc-400">
                        <span className="capitalize">{obligation.frequency}</span>
                        <span className="text-zinc-300">•</span>
                        <span>{obligation.clause_reference}</span>
                      </div>
                    </div>
                  </div>
                  <Badge variant="outline" className="capitalize">
                    {obligation.obligation_type.replace(/_/g, ' ')}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Parties Tab */}
        <TabsContent value="parties" className="space-y-6">
          {/* Borrowers */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                Borrowers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mockFacility.borrowers.map((borrower, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-zinc-50">
                    <div>
                      <p className="font-medium">{borrower.name}</p>
                      <p className="text-sm text-zinc-500">{borrower.jurisdiction}</p>
                    </div>
                    <Badge variant="outline">{borrower.role}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Lenders */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="w-5 h-5" />
                Lenders ({mockFacility.lenders.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mockFacility.lenders.map((lender, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-zinc-50">
                    <div>
                      <p className="font-medium">{lender.name}</p>
                      <p className="text-sm text-zinc-500">
                        {formatCurrency(lender.commitment_amount)} ({lender.percentage}%)
                      </p>
                    </div>
                    <div className="w-24">
                      <Progress value={lender.percentage} className="h-2" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Agents */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="w-5 h-5" />
                Agents
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mockFacility.agents.map((agent, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-zinc-50">
                    <p className="font-medium">{agent.name}</p>
                    <Badge variant="secondary">{agent.role}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
