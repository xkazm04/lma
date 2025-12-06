'use client';

import React from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  GitCompare,
  FileText,
  ArrowRight,
  Plus,
  Minus,
  Edit3,
  AlertTriangle,
  CheckCircle,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

// Mock documents for selection
const mockDocuments = [
  { id: '1', name: 'Facility Agreement - Project Apollo.pdf', date: '2024-12-05' },
  { id: '2', name: 'Amendment No. 1 - Project Apollo.docx', date: '2024-12-04' },
  { id: '3', name: 'Revolving Credit Agreement - Neptune Ltd.pdf', date: '2024-12-02' },
  { id: '4', name: 'Term Loan Agreement - XYZ Corp.pdf', date: '2024-12-01' },
];

// Mock comparison result
const mockComparisonResult = {
  document1: { id: '1', name: 'Facility Agreement - Project Apollo.pdf' },
  document2: { id: '2', name: 'Amendment No. 1 - Project Apollo.docx' },
  differences: [
    {
      category: 'Financial Terms',
      changes: [
        {
          field: 'Total Commitments',
          doc1Value: '$500,000,000',
          doc2Value: '$550,000,000',
          changeType: 'modified' as const,
          impact: 'Facility size increased by $50M',
        },
        {
          field: 'Initial Margin',
          doc1Value: '3.25%',
          doc2Value: '3.00%',
          changeType: 'modified' as const,
          impact: 'Margin reduced by 25bps',
        },
      ],
    },
    {
      category: 'Key Dates',
      changes: [
        {
          field: 'Maturity Date',
          doc1Value: 'November 20, 2029',
          doc2Value: 'November 20, 2030',
          changeType: 'modified' as const,
          impact: 'Maturity extended by 1 year',
        },
      ],
    },
    {
      category: 'Covenants',
      changes: [
        {
          field: 'Maximum Leverage Ratio',
          doc1Value: '4.50x',
          doc2Value: '5.00x',
          changeType: 'modified' as const,
          impact: 'Covenant loosened by 0.5x',
        },
        {
          field: 'Annual CapEx Limit',
          doc1Value: '$50,000,000',
          doc2Value: null,
          changeType: 'removed' as const,
          impact: 'CapEx covenant removed',
        },
      ],
    },
    {
      category: 'Parties',
      changes: [
        {
          field: 'Lender: Pacific Finance Ltd',
          doc1Value: '20%',
          doc2Value: '15%',
          changeType: 'modified' as const,
          impact: 'Commitment reduced',
        },
        {
          field: 'Lender: Asian Credit Corp',
          doc1Value: null,
          doc2Value: '5%',
          changeType: 'added' as const,
          impact: 'New lender added',
        },
      ],
    },
  ],
  impactAnalysis: 'The amendment provides more favorable terms to the borrower with increased facility size, reduced margin, extended maturity, and loosened covenants. The removal of the CapEx limit gives the borrower more operational flexibility. These changes suggest improved credit standing or competitive pressure from other lenders.',
};

function ChangeIcon({ type }: { type: 'added' | 'removed' | 'modified' }) {
  switch (type) {
    case 'added':
      return <Plus className="w-4 h-4 text-green-600" />;
    case 'removed':
      return <Minus className="w-4 h-4 text-red-600" />;
    case 'modified':
      return <Edit3 className="w-4 h-4 text-blue-600" />;
  }
}

function ChangeBadge({ type }: { type: 'added' | 'removed' | 'modified' }) {
  const config = {
    added: { label: 'Added', variant: 'success' as const },
    removed: { label: 'Removed', variant: 'destructive' as const },
    modified: { label: 'Modified', variant: 'info' as const },
  };
  return <Badge variant={config[type].variant}>{config[type].label}</Badge>;
}

function CategorySection({ category }: { category: typeof mockComparisonResult.differences[0] }) {
  const [isExpanded, setIsExpanded] = React.useState(true);

  return (
    <Card>
      <CardHeader
        className="cursor-pointer py-4"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isExpanded ? (
              <ChevronDown className="w-5 h-5 text-zinc-400" />
            ) : (
              <ChevronRight className="w-5 h-5 text-zinc-400" />
            )}
            <CardTitle className="text-lg">{category.category}</CardTitle>
            <Badge variant="secondary">{category.changes.length} changes</Badge>
          </div>
        </div>
      </CardHeader>
      {isExpanded && (
        <CardContent className="pt-0">
          <div className="space-y-3">
            {category.changes.map((change, i) => (
              <div
                key={i}
                className={cn(
                  'flex items-start gap-4 p-4 rounded-lg border',
                  change.changeType === 'added' && 'border-green-200 bg-green-50',
                  change.changeType === 'removed' && 'border-red-200 bg-red-50',
                  change.changeType === 'modified' && 'border-blue-200 bg-blue-50'
                )}
              >
                <ChangeIcon type={change.changeType} />
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-zinc-900">{change.field}</span>
                    <ChangeBadge type={change.changeType} />
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-2">
                    <div>
                      <p className="text-xs text-zinc-500 mb-1">Document 1</p>
                      <p className={cn(
                        'text-sm p-2 rounded bg-white border',
                        change.changeType === 'removed' && 'line-through text-zinc-400',
                        !change.doc1Value && 'text-zinc-400 italic'
                      )}>
                        {change.doc1Value || 'Not present'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-zinc-500 mb-1">Document 2</p>
                      <p className={cn(
                        'text-sm p-2 rounded bg-white border',
                        change.changeType === 'added' && 'font-medium',
                        !change.doc2Value && 'text-zinc-400 italic'
                      )}>
                        {change.doc2Value || 'Not present'}
                      </p>
                    </div>
                  </div>

                  <p className="text-sm text-zinc-600 flex items-center gap-2">
                    <AlertTriangle className="w-3 h-3" />
                    {change.impact}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      )}
    </Card>
  );
}

export default function DocumentComparePage() {
  const [doc1, setDoc1] = React.useState<string>('');
  const [doc2, setDoc2] = React.useState<string>('');
  const [isComparing, setIsComparing] = React.useState(false);
  const [result, setResult] = React.useState<typeof mockComparisonResult | null>(null);

  const handleCompare = async () => {
    if (!doc1 || !doc2) return;

    setIsComparing(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    setResult(mockComparisonResult);
    setIsComparing(false);
  };

  const totalChanges = result?.differences.reduce((acc, cat) => acc + cat.changes.length, 0) || 0;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-4">
        <Link href="/documents">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Document Comparison</h1>
          <p className="text-zinc-500">Compare two documents to identify changes and differences</p>
        </div>
      </div>

      {/* Document Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Select Documents</CardTitle>
          <CardDescription>
            Choose two documents to compare. Typically used to compare an original agreement with an amendment.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium text-zinc-700 mb-2 block">
                Document 1 (Original)
              </label>
              <Select value={doc1} onValueChange={setDoc1}>
                <SelectTrigger>
                  <SelectValue placeholder="Select first document" />
                </SelectTrigger>
                <SelectContent>
                  {mockDocuments.map(doc => (
                    <SelectItem key={doc.id} value={doc.id} disabled={doc.id === doc2}>
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-zinc-400" />
                        <span>{doc.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="pt-6">
              <ArrowRight className="w-5 h-5 text-zinc-400" />
            </div>

            <div className="flex-1">
              <label className="text-sm font-medium text-zinc-700 mb-2 block">
                Document 2 (Amendment)
              </label>
              <Select value={doc2} onValueChange={setDoc2}>
                <SelectTrigger>
                  <SelectValue placeholder="Select second document" />
                </SelectTrigger>
                <SelectContent>
                  {mockDocuments.map(doc => (
                    <SelectItem key={doc.id} value={doc.id} disabled={doc.id === doc1}>
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-zinc-400" />
                        <span>{doc.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="pt-6">
              <Button
                onClick={handleCompare}
                disabled={!doc1 || !doc2 || isComparing}
              >
                {isComparing ? (
                  <>
                    <span className="animate-spin mr-2">
                      <GitCompare className="w-4 h-4" />
                    </span>
                    Comparing...
                  </>
                ) : (
                  <>
                    <GitCompare className="w-4 h-4 mr-2" />
                    Compare
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Comparison Results */}
      {result && (
        <>
          {/* Summary Stats */}
          <div className="grid grid-cols-4 gap-4">
            <Card>
              <CardContent className="py-4">
                <p className="text-sm text-zinc-500">Total Changes</p>
                <p className="text-2xl font-bold text-zinc-900">{totalChanges}</p>
              </CardContent>
            </Card>
            <Card className="bg-green-50 border-green-200">
              <CardContent className="py-4">
                <p className="text-sm text-green-600">Added</p>
                <p className="text-2xl font-bold text-green-700">
                  {result.differences.reduce(
                    (acc, cat) => acc + cat.changes.filter(c => c.changeType === 'added').length,
                    0
                  )}
                </p>
              </CardContent>
            </Card>
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="py-4">
                <p className="text-sm text-blue-600">Modified</p>
                <p className="text-2xl font-bold text-blue-700">
                  {result.differences.reduce(
                    (acc, cat) => acc + cat.changes.filter(c => c.changeType === 'modified').length,
                    0
                  )}
                </p>
              </CardContent>
            </Card>
            <Card className="bg-red-50 border-red-200">
              <CardContent className="py-4">
                <p className="text-sm text-red-600">Removed</p>
                <p className="text-2xl font-bold text-red-700">
                  {result.differences.reduce(
                    (acc, cat) => acc + cat.changes.filter(c => c.changeType === 'removed').length,
                    0
                  )}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Impact Analysis */}
          <Card className="border-amber-200 bg-amber-50">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                Impact Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-amber-900">{result.impactAnalysis}</p>
            </CardContent>
          </Card>

          {/* Detailed Changes by Category */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-zinc-900">Detailed Changes</h2>
            {result.differences.map((category, i) => (
              <CategorySection key={i} category={category} />
            ))}
          </div>

          {/* Export Button */}
          <div className="flex justify-end">
            <Button variant="outline">
              Export Comparison Report
            </Button>
          </div>
        </>
      )}

      {/* Empty State */}
      {!result && !isComparing && (
        <Card className="py-12">
          <CardContent className="text-center">
            <GitCompare className="w-12 h-12 text-zinc-300 mx-auto mb-4" />
            <p className="text-zinc-500 mb-2">Select two documents to compare</p>
            <p className="text-sm text-zinc-400">
              The comparison will identify added, removed, and modified terms
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
