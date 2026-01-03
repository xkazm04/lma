'use client';

import React from 'react';
import Link from 'next/link';
import {
  Plus,
  Search,
  Building2,
  AlertTriangle,
  CheckCircle,
  Clock,
  ArrowRight,
  ExternalLink,
  MoreVertical,
  FileText,
  XCircle,
  ShieldAlert,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { PageContainer } from '@/components/layout';
import { cn } from '@/lib/utils';

// Mock facilities data
const mockFacilities = [
  {
    id: '1',
    facility_name: 'ABC Holdings - Term Loan A',
    borrower_name: 'ABC Holdings LLC',
    facility_type: 'term_loan',
    status: 'active',
    commitment_amount: 250000000,
    currency: 'USD',
    maturity_date: '2028-12-15',
    created_at: '2024-01-15T10:00:00Z',
    stats: {
      total_obligations: 12,
      upcoming_30_days: 3,
      overdue: 0,
      total_covenants: 4,
      covenants_at_risk: 0,
    },
  },
  {
    id: '2',
    facility_name: 'XYZ Corp - Revolving Facility',
    borrower_name: 'XYZ Corporation',
    facility_type: 'revolving_credit',
    status: 'active',
    commitment_amount: 100000000,
    currency: 'USD',
    maturity_date: '2027-06-30',
    created_at: '2024-02-20T14:00:00Z',
    stats: {
      total_obligations: 8,
      upcoming_30_days: 2,
      overdue: 0,
      total_covenants: 3,
      covenants_at_risk: 1,
    },
  },
  {
    id: '3',
    facility_name: 'Delta Manufacturing - Term Loan',
    borrower_name: 'Delta Manufacturing Co',
    facility_type: 'term_loan',
    status: 'waiver_period',
    commitment_amount: 75000000,
    currency: 'USD',
    maturity_date: '2026-09-15',
    created_at: '2023-09-15T09:00:00Z',
    stats: {
      total_obligations: 10,
      upcoming_30_days: 1,
      overdue: 1,
      total_covenants: 3,
      covenants_at_risk: 1,
    },
  },
  {
    id: '4',
    facility_name: 'Neptune Holdings - Senior Secured',
    borrower_name: 'Neptune Holdings Inc',
    facility_type: 'term_loan',
    status: 'active',
    commitment_amount: 500000000,
    currency: 'USD',
    maturity_date: '2029-03-31',
    created_at: '2024-03-01T11:00:00Z',
    stats: {
      total_obligations: 15,
      upcoming_30_days: 4,
      overdue: 0,
      total_covenants: 5,
      covenants_at_risk: 0,
    },
  },
  {
    id: '5',
    facility_name: 'Sigma Holdings - ABL',
    borrower_name: 'Sigma Holdings Inc',
    facility_type: 'abl',
    status: 'default',
    commitment_amount: 50000000,
    currency: 'USD',
    maturity_date: '2025-12-31',
    created_at: '2023-06-01T08:00:00Z',
    stats: {
      total_obligations: 6,
      upcoming_30_days: 0,
      overdue: 2,
      total_covenants: 2,
      covenants_at_risk: 2,
    },
  },
];

function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(amount);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric',
  });
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'active':
      return <Badge className="bg-green-100 text-green-700 hover:bg-green-100 text-[10px] px-1.5 py-0 h-5">Active</Badge>;
    case 'waiver_period':
      return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 text-[10px] px-1.5 py-0 h-5">Waiver</Badge>;
    case 'default':
      return <Badge variant="destructive" className="text-[10px] px-1.5 py-0 h-5">Default</Badge>;
    case 'closed':
      return <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-5">Closed</Badge>;
    default:
      return <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-5">{status}</Badge>;
  }
}

function getFacilityTypeLabel(type: string): string {
  switch (type) {
    case 'term_loan':
      return 'TL';
    case 'revolving_credit':
      return 'RCF';
    case 'abl':
      return 'ABL';
    case 'delayed_draw':
      return 'DDTL';
    case 'bridge':
      return 'Bridge';
    case 'bilateral':
      return 'Bilateral';
    default:
      return type;
  }
}

export default function ComplianceFacilitiesPage() {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('all');
  const [typeFilter, setTypeFilter] = React.useState('all');

  const filteredFacilities = mockFacilities.filter((facility) => {
    const matchesSearch =
      facility.facility_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      facility.borrower_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || facility.status === statusFilter;
    const matchesType = typeFilter === 'all' || facility.facility_type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  const statusCounts = {
    all: mockFacilities.length,
    active: mockFacilities.filter((f) => f.status === 'active').length,
    waiver_period: mockFacilities.filter((f) => f.status === 'waiver_period').length,
    default: mockFacilities.filter((f) => f.status === 'default').length,
    closed: mockFacilities.filter((f) => f.status === 'closed').length,
  };

  return (
    <PageContainer>
      <div className="space-y-4 animate-in fade-in">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm text-zinc-500 mb-1">
              <Link href="/compliance" className="hover:text-zinc-900 transition-colors">
                Compliance
              </Link>
              <span>/</span>
              <span className="text-zinc-900">Facilities</span>
            </div>
            <h1 className="text-2xl font-bold text-zinc-900">Compliance Facilities</h1>
            <p className="text-zinc-500 text-sm">Track compliance obligations across your loan portfolio</p>
          </div>
          <Button size="sm">
            <Plus className="w-4 h-4 mr-1" />
            Add Facility
          </Button>
        </div>

        {/* Stats + Filters Bar */}
        <Card>
          <CardContent className="py-3">
            <div className="flex items-center gap-4 flex-wrap">
              {/* Stats indicators */}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-green-50 border border-green-200">
                  <CheckCircle className="w-3.5 h-3.5 text-green-600" />
                  <span className="text-sm font-semibold text-green-700">{statusCounts.active}</span>
                  <span className="text-[10px] text-green-600">Active</span>
                </div>
                <div className={cn(
                  'flex items-center gap-1.5 px-2 py-1 rounded',
                  statusCounts.waiver_period > 0 ? 'bg-amber-50 border border-amber-200' : 'bg-zinc-50'
                )}>
                  <Clock className={cn('w-3.5 h-3.5', statusCounts.waiver_period > 0 ? 'text-amber-600' : 'text-zinc-400')} />
                  <span className={cn('text-sm font-semibold', statusCounts.waiver_period > 0 ? 'text-amber-700' : 'text-zinc-500')}>{statusCounts.waiver_period}</span>
                  <span className={cn('text-[10px]', statusCounts.waiver_period > 0 ? 'text-amber-600' : 'text-zinc-400')}>Waiver</span>
                </div>
                <div className={cn(
                  'flex items-center gap-1.5 px-2 py-1 rounded',
                  statusCounts.default > 0 ? 'bg-red-50 border border-red-200' : 'bg-zinc-50'
                )}>
                  <XCircle className={cn('w-3.5 h-3.5', statusCounts.default > 0 ? 'text-red-600' : 'text-zinc-400')} />
                  <span className={cn('text-sm font-semibold', statusCounts.default > 0 ? 'text-red-700' : 'text-zinc-500')}>{statusCounts.default}</span>
                  <span className={cn('text-[10px]', statusCounts.default > 0 ? 'text-red-600' : 'text-zinc-400')}>Default</span>
                </div>
              </div>

              <div className="w-px h-6 bg-zinc-200" />

              {/* Search */}
              <div className="relative flex-1 max-w-xs">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <Input
                  placeholder="Search facilities..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 h-8 text-sm"
                />
              </div>

              {/* Status Filter */}
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-36 h-8 text-sm">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="waiver_period">Waiver Period</SelectItem>
                  <SelectItem value="default">Default</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>

              {/* Type Filter */}
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-32 h-8 text-sm">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="term_loan">Term Loan</SelectItem>
                  <SelectItem value="revolving_credit">Revolver</SelectItem>
                  <SelectItem value="abl">ABL</SelectItem>
                  <SelectItem value="delayed_draw">DDTL</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Facilities Table */}
        {filteredFacilities.length > 0 ? (
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-100 bg-zinc-50/50">
                    <th className="text-left py-2.5 px-4 font-medium text-zinc-500 text-xs uppercase tracking-wider">Facility</th>
                    <th className="text-left py-2.5 px-3 font-medium text-zinc-500 text-xs uppercase tracking-wider">Status</th>
                    <th className="text-right py-2.5 px-3 font-medium text-zinc-500 text-xs uppercase tracking-wider">Commitment</th>
                    <th className="text-center py-2.5 px-3 font-medium text-zinc-500 text-xs uppercase tracking-wider">Maturity</th>
                    <th className="text-center py-2.5 px-3 font-medium text-zinc-500 text-xs uppercase tracking-wider">Obligations</th>
                    <th className="text-center py-2.5 px-3 font-medium text-zinc-500 text-xs uppercase tracking-wider">Covenants</th>
                    <th className="text-center py-2.5 px-3 font-medium text-zinc-500 text-xs uppercase tracking-wider">Alerts</th>
                    <th className="py-2.5 px-3 w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {filteredFacilities.map((facility) => {
                    const hasAlerts = facility.stats.overdue > 0 || facility.stats.covenants_at_risk > 0;

                    return (
                      <tr
                        key={facility.id}
                        className="hover:bg-zinc-50/50 transition-colors"
                      >
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <Link
                              href={`/compliance/facilities/${facility.id}`}
                              className="font-medium text-zinc-900 hover:text-blue-600 transition-colors"
                            >
                              {facility.facility_name}
                            </Link>
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 font-normal">
                              {getFacilityTypeLabel(facility.facility_type)}
                            </Badge>
                          </div>
                          <p className="text-xs text-zinc-500 mt-0.5">{facility.borrower_name}</p>
                        </td>
                        <td className="py-3 px-3">
                          {getStatusBadge(facility.status)}
                        </td>
                        <td className="py-3 px-3 text-right font-medium text-zinc-900">
                          {formatCurrency(facility.commitment_amount, facility.currency)}
                        </td>
                        <td className="py-3 px-3 text-center text-zinc-600">
                          {formatDate(facility.maturity_date)}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <span className="font-medium text-zinc-900">{facility.stats.total_obligations}</span>
                            {facility.stats.upcoming_30_days > 0 && (
                              <span className="text-[10px] text-zinc-500">({facility.stats.upcoming_30_days} due)</span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <span className="font-medium text-zinc-900">{facility.stats.total_covenants}</span>
                            {facility.stats.covenants_at_risk > 0 && (
                              <span className="text-[10px] text-amber-600">({facility.stats.covenants_at_risk} risk)</span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-3 text-center">
                          {hasAlerts ? (
                            <div className="flex items-center justify-center gap-1">
                              {facility.stats.overdue > 0 && (
                                <div className="flex items-center gap-0.5 text-red-600" title={`${facility.stats.overdue} overdue`}>
                                  <AlertTriangle className="w-3.5 h-3.5" />
                                  <span className="text-xs font-medium">{facility.stats.overdue}</span>
                                </div>
                              )}
                              {facility.stats.covenants_at_risk > 0 && (
                                <div className="flex items-center gap-0.5 text-amber-600" title={`${facility.stats.covenants_at_risk} at risk`}>
                                  <ShieldAlert className="w-3.5 h-3.5" />
                                  <span className="text-xs font-medium">{facility.stats.covenants_at_risk}</span>
                                </div>
                              )}
                            </div>
                          ) : (
                            <CheckCircle className="w-4 h-4 text-green-500 mx-auto" />
                          )}
                        </td>
                        <td className="py-3 px-3">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-7 w-7">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem asChild>
                                <Link href={`/compliance/facilities/${facility.id}`}>
                                  <ArrowRight className="w-4 h-4 mr-2" />
                                  View Details
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <FileText className="w-4 h-4 mr-2" />
                                View Document
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <ExternalLink className="w-4 h-4 mr-2" />
                                Export Report
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-red-600">Archive</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        ) : (
          <Card className="py-12">
            <CardContent className="text-center">
              <Building2 className="w-12 h-12 mx-auto text-zinc-300 mb-4" />
              <p className="text-zinc-500">No facilities found matching your filters.</p>
              <Button className="mt-4" size="sm">
                <Plus className="w-4 h-4 mr-1" />
                Add Facility
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </PageContainer>
  );
}
