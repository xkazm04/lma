'use client';

import React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Edit3,
  Save,
  X,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

// Mock extraction data with confidence scores
const mockExtractionFields = [
  {
    id: '1',
    category: 'Basic Information',
    fields: [
      { name: 'Facility Name', value: 'Project Apollo Senior Secured Term Loan Facility', confidence: 0.98, source: 'Page 1, Line 5' },
      { name: 'Facility Reference', value: 'APOLLO-2024-001', confidence: 0.95, source: 'Page 2, Line 12' },
      { name: 'Facility Type', value: 'Term Loan', confidence: 0.96, source: 'Page 1, Line 8' },
      { name: 'Governing Law', value: 'New York', confidence: 0.99, source: 'Page 145, Section 12.1' },
    ],
  },
  {
    id: '2',
    category: 'Key Dates',
    fields: [
      { name: 'Execution Date', value: '2024-11-15', confidence: 0.97, source: 'Page 1, Header' },
      { name: 'Effective Date', value: '2024-11-20', confidence: 0.94, source: 'Page 3, Section 1.1' },
      { name: 'Maturity Date', value: '2029-11-20', confidence: 0.92, source: 'Page 4, Section 2.3' },
    ],
  },
  {
    id: '3',
    category: 'Financial Terms',
    fields: [
      { name: 'Total Commitments', value: '$500,000,000', confidence: 0.99, source: 'Page 5, Section 3.1' },
      { name: 'Currency', value: 'USD', confidence: 0.99, source: 'Page 5, Section 3.1' },
      { name: 'Base Rate', value: 'SOFR', confidence: 0.88, source: 'Page 12, Section 4.2' },
      { name: 'Initial Margin', value: '3.25%', confidence: 0.85, source: 'Page 12, Section 4.3' },
      { name: 'Commitment Fee', value: '0.50%', confidence: 0.72, source: 'Page 15, Section 4.5', flagged: true },
    ],
  },
  {
    id: '4',
    category: 'Covenants',
    fields: [
      { name: 'Max Leverage Ratio', value: '4.50x', confidence: 0.93, source: 'Page 78, Section 7.1(a)' },
      { name: 'Min Interest Coverage', value: '3.00x', confidence: 0.91, source: 'Page 78, Section 7.1(b)' },
      { name: 'Max CapEx', value: '$50,000,000', confidence: 0.68, source: 'Page 82, Section 7.2', flagged: true },
      { name: 'Covenant Testing', value: 'Quarterly', confidence: 0.95, source: 'Page 77, Section 7.1' },
    ],
  },
];

function ConfidenceIndicator({ value }: { value: number }) {
  const percent = Math.round(value * 100);
  const color = percent >= 90 ? 'bg-green-500' : percent >= 70 ? 'bg-amber-500' : 'bg-red-500';
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-1.5 bg-zinc-200 rounded-full overflow-hidden">
        <div className={cn('h-full rounded-full', color)} style={{ width: `${percent}%` }} />
      </div>
      <span className={cn(
        'text-xs font-medium',
        percent >= 90 ? 'text-green-600' : percent >= 70 ? 'text-amber-600' : 'text-red-600'
      )}>
        {percent}%
      </span>
    </div>
  );
}

interface FieldRowProps {
  field: {
    name: string;
    value: string;
    confidence: number;
    source: string;
    flagged?: boolean;
  };
}

function FieldRow({ field }: FieldRowProps) {
  const [isEditing, setIsEditing] = React.useState(false);
  const [editValue, setEditValue] = React.useState(field.value);
  const [isVerified, setIsVerified] = React.useState(false);

  const handleSave = () => {
    // TODO: Save the edited value
    setIsEditing(false);
  };

  const handleVerify = () => {
    setIsVerified(true);
  };

  return (
    <div className={cn(
      'flex items-center gap-4 py-3 px-4 rounded-lg border',
      field.flagged && !isVerified ? 'border-amber-200 bg-amber-50' : 'border-zinc-100 bg-white',
      isVerified && 'border-green-200 bg-green-50'
    )}>
      {/* Status Icon */}
      <div className="shrink-0">
        {isVerified ? (
          <CheckCircle className="w-5 h-5 text-green-600" />
        ) : field.flagged ? (
          <AlertCircle className="w-5 h-5 text-amber-600" />
        ) : (
          <CheckCircle className="w-5 h-5 text-zinc-300" />
        )}
      </div>

      {/* Field Name & Source */}
      <div className="w-40 shrink-0">
        <p className="text-sm font-medium text-zinc-900">{field.name}</p>
        <p className="text-xs text-zinc-400">{field.source}</p>
      </div>

      {/* Value */}
      <div className="flex-1">
        {isEditing ? (
          <Input
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            className="h-8"
          />
        ) : (
          <p className="text-sm text-zinc-700">{field.value}</p>
        )}
      </div>

      {/* Confidence */}
      <div className="w-24 shrink-0">
        <ConfidenceIndicator value={field.confidence} />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 shrink-0">
        {isEditing ? (
          <>
            <Button variant="ghost" size="icon" onClick={handleSave}>
              <Save className="w-4 h-4 text-green-600" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setIsEditing(false)}>
              <X className="w-4 h-4 text-zinc-400" />
            </Button>
          </>
        ) : (
          <>
            <Button variant="ghost" size="icon" onClick={() => setIsEditing(true)}>
              <Edit3 className="w-4 h-4 text-zinc-400" />
            </Button>
            {!isVerified && (
              <Button variant="ghost" size="sm" onClick={handleVerify}>
                <CheckCircle className="w-4 h-4 mr-1" />
                Verify
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function CategorySection({ category }: { category: typeof mockExtractionFields[0] }) {
  const [isExpanded, setIsExpanded] = React.useState(true);
  const flaggedCount = category.fields.filter(f => f.flagged).length;

  return (
    <Card>
      <CardHeader
        className="cursor-pointer"
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
            <Badge variant="secondary">{category.fields.length} fields</Badge>
            {flaggedCount > 0 && (
              <Badge variant="warning">{flaggedCount} needs review</Badge>
            )}
          </div>
        </div>
      </CardHeader>
      {isExpanded && (
        <CardContent className="space-y-2">
          {category.fields.map((field, i) => (
            <FieldRow key={i} field={field} />
          ))}
        </CardContent>
      )}
    </Card>
  );
}

export default function ExtractionReviewPage() {
  const params = useParams();
  const documentId = params.id as string;

  const totalFields = mockExtractionFields.reduce((acc, cat) => acc + cat.fields.length, 0);
  const flaggedFields = mockExtractionFields.reduce(
    (acc, cat) => acc + cat.fields.filter(f => f.flagged).length,
    0
  );
  const avgConfidence = mockExtractionFields.reduce(
    (acc, cat) => acc + cat.fields.reduce((a, f) => a + f.confidence, 0),
    0
  ) / totalFields;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <Link href={`/documents/${documentId}`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-zinc-900">Extraction Review</h1>
            <p className="text-zinc-500">
              Review and verify extracted data from Facility Agreement - Project Apollo.pdf
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">Discard Changes</Button>
          <Button>Save All Changes</Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="py-4">
            <p className="text-sm text-zinc-500">Total Fields</p>
            <p className="text-2xl font-bold text-zinc-900">{totalFields}</p>
          </CardContent>
        </Card>
        <Card className={flaggedFields > 0 ? 'border-amber-200 bg-amber-50' : ''}>
          <CardContent className="py-4">
            <p className="text-sm text-zinc-500">Needs Review</p>
            <p className="text-2xl font-bold text-amber-600">{flaggedFields}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <p className="text-sm text-zinc-500">Average Confidence</p>
            <div className="flex items-center gap-2 mt-1">
              <Progress value={avgConfidence * 100} className="h-2 flex-1" />
              <span className="text-lg font-bold text-zinc-900">
                {Math.round(avgConfidence * 100)}%
              </span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <p className="text-sm text-zinc-500">Categories</p>
            <p className="text-2xl font-bold text-zinc-900">{mockExtractionFields.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Help Banner */}
      {flaggedFields > 0 && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-amber-900">
                  {flaggedFields} field{flaggedFields > 1 ? 's' : ''} need{flaggedFields === 1 ? 's' : ''} your attention
                </p>
                <p className="text-sm text-amber-700 mt-1">
                  These fields have lower confidence scores. Please verify the extracted values against the source document.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Field Categories */}
      <div className="space-y-4">
        {mockExtractionFields.map((category) => (
          <CategorySection key={category.id} category={category} />
        ))}
      </div>

      {/* Bottom Actions */}
      <div className="flex items-center justify-between pt-4 border-t">
        <Button variant="outline" asChild>
          <Link href={`/documents/${documentId}`}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Document
          </Link>
        </Button>
        <div className="flex items-center gap-2">
          <Button variant="outline">Mark All as Verified</Button>
          <Button>Save & Complete Review</Button>
        </div>
      </div>
    </div>
  );
}
