'use client';

import React from 'react';
import Link from 'next/link';
import {
  Plus,
  Search,
  Filter,
  Grid,
  List,
  SortAsc,
  GitCompare,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DocumentCard } from '@/components/documents';
import type { LoanDocument } from '@/types';

// Mock documents data
const mockDocuments: LoanDocument[] = [
  {
    id: '1',
    organization_id: 'org-1',
    uploaded_by: 'user-1',
    uploaded_at: '2024-12-05T10:30:00Z',
    original_filename: 'Facility Agreement - Project Apollo.pdf',
    storage_path: '/documents/1.pdf',
    document_type: 'facility_agreement',
    processing_status: 'completed',
    extraction_version: 1,
    raw_text: null,
    page_count: 245,
    file_size: 2500000,
    error_message: null,
    created_at: '2024-12-05T10:30:00Z',
    updated_at: '2024-12-05T10:35:00Z',
  },
  {
    id: '2',
    organization_id: 'org-1',
    uploaded_by: 'user-1',
    uploaded_at: '2024-12-04T14:20:00Z',
    original_filename: 'Amendment No. 1 - XYZ Corp Term Loan.docx',
    storage_path: '/documents/2.docx',
    document_type: 'amendment',
    processing_status: 'completed',
    extraction_version: 1,
    raw_text: null,
    page_count: 45,
    file_size: 850000,
    error_message: null,
    created_at: '2024-12-04T14:20:00Z',
    updated_at: '2024-12-04T14:25:00Z',
  },
  {
    id: '3',
    organization_id: 'org-1',
    uploaded_by: 'user-2',
    uploaded_at: '2024-12-03T09:15:00Z',
    original_filename: 'Consent Request - ABC Holdings.pdf',
    storage_path: '/documents/3.pdf',
    document_type: 'consent',
    processing_status: 'processing',
    extraction_version: 1,
    raw_text: null,
    page_count: null,
    file_size: 1200000,
    error_message: null,
    created_at: '2024-12-03T09:15:00Z',
    updated_at: '2024-12-03T09:15:00Z',
  },
  {
    id: '4',
    organization_id: 'org-1',
    uploaded_by: 'user-1',
    uploaded_at: '2024-12-02T16:45:00Z',
    original_filename: 'Revolving Credit Agreement - Neptune Ltd.pdf',
    storage_path: '/documents/4.pdf',
    document_type: 'facility_agreement',
    processing_status: 'review_required',
    extraction_version: 1,
    raw_text: null,
    page_count: 312,
    file_size: 3800000,
    error_message: 'Low confidence extraction for some fields',
    created_at: '2024-12-02T16:45:00Z',
    updated_at: '2024-12-02T17:00:00Z',
  },
  {
    id: '5',
    organization_id: 'org-1',
    uploaded_by: 'user-3',
    uploaded_at: '2024-12-01T11:00:00Z',
    original_filename: 'Assignment Agreement - Delta Corp.pdf',
    storage_path: '/documents/5.pdf',
    document_type: 'assignment',
    processing_status: 'failed',
    extraction_version: 1,
    raw_text: null,
    page_count: null,
    file_size: 950000,
    error_message: 'Unable to parse document structure',
    created_at: '2024-12-01T11:00:00Z',
    updated_at: '2024-12-01T11:05:00Z',
  },
];

export default function DocumentsPage() {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('all');
  const [typeFilter, setTypeFilter] = React.useState('all');
  const [viewMode, setViewMode] = React.useState<'grid' | 'list'>('grid');
  const [selectedDocs, setSelectedDocs] = React.useState<string[]>([]);

  const filteredDocuments = mockDocuments.filter((doc) => {
    const matchesSearch = doc.original_filename
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || doc.processing_status === statusFilter;
    const matchesType = typeFilter === 'all' || doc.document_type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  const handleDelete = (id: string) => {
    console.log('Delete document:', id);
    // TODO: Implement delete
  };

  const handleReprocess = (id: string) => {
    console.log('Reprocess document:', id);
    // TODO: Implement reprocess
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Document Hub</h1>
          <p className="text-zinc-500">Upload, analyze, and manage loan documents</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/documents/compare">
            <Button variant="outline">
              <GitCompare className="w-4 h-4 mr-2" />
              Compare
            </Button>
          </Link>
          <Link href="/documents/upload">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Upload Documents
            </Button>
          </Link>
        </div>
      </div>

      {/* Filters Bar */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center gap-4">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <Input
                placeholder="Search documents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <Filter className="w-4 h-4 mr-2 text-zinc-400" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="review_required">Review Required</SelectItem>
              </SelectContent>
            </Select>

            {/* Type Filter */}
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Document Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="facility_agreement">Facility Agreement</SelectItem>
                <SelectItem value="amendment">Amendment</SelectItem>
                <SelectItem value="consent">Consent</SelectItem>
                <SelectItem value="assignment">Assignment</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>

            {/* Sort */}
            <Button variant="outline" size="icon">
              <SortAsc className="w-4 h-4" />
            </Button>

            {/* View Toggle */}
            <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'grid' | 'list')}>
              <TabsList>
                <TabsTrigger value="grid">
                  <Grid className="w-4 h-4" />
                </TabsTrigger>
                <TabsTrigger value="list">
                  <List className="w-4 h-4" />
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardContent>
      </Card>

      {/* Document Stats */}
      <div className="grid grid-cols-5 gap-4">
        <Card className="bg-zinc-50">
          <CardContent className="py-3 text-center">
            <p className="text-2xl font-bold text-zinc-900">{mockDocuments.length}</p>
            <p className="text-xs text-zinc-500">Total</p>
          </CardContent>
        </Card>
        <Card className="bg-green-50">
          <CardContent className="py-3 text-center">
            <p className="text-2xl font-bold text-green-600">
              {mockDocuments.filter((d) => d.processing_status === 'completed').length}
            </p>
            <p className="text-xs text-green-600">Completed</p>
          </CardContent>
        </Card>
        <Card className="bg-amber-50">
          <CardContent className="py-3 text-center">
            <p className="text-2xl font-bold text-amber-600">
              {mockDocuments.filter((d) => d.processing_status === 'processing').length}
            </p>
            <p className="text-xs text-amber-600">Processing</p>
          </CardContent>
        </Card>
        <Card className="bg-orange-50">
          <CardContent className="py-3 text-center">
            <p className="text-2xl font-bold text-orange-600">
              {mockDocuments.filter((d) => d.processing_status === 'review_required').length}
            </p>
            <p className="text-xs text-orange-600">Review</p>
          </CardContent>
        </Card>
        <Card className="bg-red-50">
          <CardContent className="py-3 text-center">
            <p className="text-2xl font-bold text-red-600">
              {mockDocuments.filter((d) => d.processing_status === 'failed').length}
            </p>
            <p className="text-xs text-red-600">Failed</p>
          </CardContent>
        </Card>
      </div>

      {/* Document Grid/List */}
      {filteredDocuments.length > 0 ? (
        <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 gap-4' : 'space-y-4'}>
          {filteredDocuments.map((doc) => (
            <DocumentCard
              key={doc.id}
              document={doc}
              onDelete={handleDelete}
              onReprocess={handleReprocess}
            />
          ))}
        </div>
      ) : (
        <Card className="py-12">
          <CardContent className="text-center">
            <p className="text-zinc-500">No documents found matching your filters.</p>
            <Link href="/documents/upload">
              <Button className="mt-4">
                <Plus className="w-4 h-4 mr-2" />
                Upload Documents
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
