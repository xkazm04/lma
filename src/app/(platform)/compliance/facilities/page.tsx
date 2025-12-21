'use client';

import React from 'react';
import Link from 'next/link';
import {
  Plus,
  Search,
  Filter,
  Building2,
  AlertTriangle,
  CheckCircle,
  Clock,
  ArrowRight,
  ExternalLink,
  MoreVertical,
  FileText,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Progress } from '@/components/ui/progress';

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
    day: 'numeric',
    year: 'numeric',
  });
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'active':
      return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Active</Badge>;
    case 'waiver_period':
      return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">Waiver Period</Badge>;
    case 'default':
      return <Badge variant="destructive">Default</Badge>;
    case 'closed':
      return <Badge variant="secondary">Closed</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
}

function getFacilityTypeLabel(type: string): string {
  switch (type) {
    case 'term_loan':
      return 'Term Loan';
    case 'revolving_credit':
      return 'Revolver';
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
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-zinc-500 mb-1">
            <Link href="/compliance" className="hover:text-zinc-900">
              Compliance
            </Link>
            <span>/</span>
            <span className="text-zinc-900">Facilities</span>
          </div>
          <h1 className="text-2xl font-bold text-zinc-900">Compliance Facilities</h1>
          <p className="text-zinc-500">Track compliance obligations across your loan portfolio</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Sync from Documents
          </Button>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Add Facility
          </Button>
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
                placeholder="Search facilities or borrowers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <Filter className="w-4 h-4 mr-2 text-zinc-400" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status ({statusCounts.all})</SelectItem>
                <SelectItem value="active">Active ({statusCounts.active})</SelectItem>
                <SelectItem value="waiver_period">Waiver Period ({statusCounts.waiver_period})</SelectItem>
                <SelectItem value="default">Default ({statusCounts.default})</SelectItem>
                <SelectItem value="closed">Closed ({statusCounts.closed})</SelectItem>
              </SelectContent>
            </Select>

            {/* Type Filter */}
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Facility Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="term_loan">Term Loan</SelectItem>
                <SelectItem value="revolving_credit">Revolver</SelectItem>
                <SelectItem value="abl">ABL</SelectItem>
                <SelectItem value="delayed_draw">DDTL</SelectItem>
                <SelectItem value="bridge">Bridge</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Status Summary */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="bg-green-50">
          <CardContent className="py-3 text-center">
            <p className="text-2xl font-bold text-green-600">{statusCounts.active}</p>
            <p className="text-xs text-green-600">Active</p>
          </CardContent>
        </Card>
        <Card className="bg-amber-50">
          <CardContent className="py-3 text-center">
            <p className="text-2xl font-bold text-amber-600">{statusCounts.waiver_period}</p>
            <p className="text-xs text-amber-600">Waiver Period</p>
          </CardContent>
        </Card>
        <Card className="bg-red-50">
          <CardContent className="py-3 text-center">
            <p className="text-2xl font-bold text-red-600">{statusCounts.default}</p>
            <p className="text-xs text-red-600">Default</p>
          </CardContent>
        </Card>
        <Card className="bg-zinc-100">
          <CardContent className="py-3 text-center">
            <p className="text-2xl font-bold text-zinc-600">{statusCounts.closed}</p>
            <p className="text-xs text-zinc-600">Closed</p>
          </CardContent>
        </Card>
      </div>

      {/* Facilities List */}
      {filteredFacilities.length > 0 ? (
        <div className="space-y-4">
          {filteredFacilities.map((facility) => {
            const complianceRate =
              facility.stats.total_obligations > 0
                ? Math.round(
                    ((facility.stats.total_obligations - facility.stats.overdue) /
                      facility.stats.total_obligations) *
                      100
                  )
                : 100;

            return (
              <Card key={facility.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Link
                          href={`/compliance/facilities/${facility.id}`}
                          className="text-lg font-semibold text-zinc-900 hover:text-blue-600"
                        >
                          {facility.facility_name}
                        </Link>
                        {getStatusBadge(facility.status)}
                        <Badge variant="outline">{getFacilityTypeLabel(facility.facility_type)}</Badge>
                      </div>
                      <p className="text-sm text-zinc-500 mb-4">{facility.borrower_name}</p>

                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        <div>
                          <p className="text-xs text-zinc-500">Commitment</p>
                          <p className="text-sm font-semibold text-zinc-900">
                            {formatCurrency(facility.commitment_amount, facility.currency)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-zinc-500">Maturity</p>
                          <p className="text-sm font-semibold text-zinc-900">
                            {formatDate(facility.maturity_date)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-zinc-500">Obligations</p>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold text-zinc-900">
                              {facility.stats.total_obligations}
                            </p>
                            {facility.stats.upcoming_30_days > 0 && (
                              <Badge variant="secondary" className="text-xs">
                                {facility.stats.upcoming_30_days} due
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div>
                          <p className="text-xs text-zinc-500">Covenants</p>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold text-zinc-900">
                              {facility.stats.total_covenants}
                            </p>
                            {facility.stats.covenants_at_risk > 0 && (
                              <Badge variant="destructive" className="text-xs">
                                {facility.stats.covenants_at_risk} at risk
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div>
                          <p className="text-xs text-zinc-500 mb-1">Compliance</p>
                          <div className="flex items-center gap-2">
                            <Progress value={complianceRate} className="h-2 flex-1" />
                            <span className="text-sm font-semibold text-zinc-900">{complianceRate}%</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link href={`/compliance/facilities/${facility.id}`}>
                        <Button variant="outline" size="sm">
                          View Details
                          <ArrowRight className="w-4 h-4 ml-1" />
                        </Button>
                      </Link>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <FileText className="w-4 h-4 mr-2" />
                            View Source Document
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <ExternalLink className="w-4 h-4 mr-2" />
                            Export Compliance Report
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem>Edit Facility</DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600">Archive Facility</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  {/* Warning Indicators */}
                  {(facility.stats.overdue > 0 || facility.stats.covenants_at_risk > 0) && (
                    <div className="flex items-center gap-4 mt-4 pt-4 border-t border-zinc-100">
                      {facility.stats.overdue > 0 && (
                        <div className="flex items-center gap-2 text-red-600">
                          <AlertTriangle className="w-4 h-4" />
                          <span className="text-sm">{facility.stats.overdue} overdue item(s)</span>
                        </div>
                      )}
                      {facility.stats.covenants_at_risk > 0 && (
                        <div className="flex items-center gap-2 text-amber-600">
                          <Clock className="w-4 h-4" />
                          <span className="text-sm">
                            {facility.stats.covenants_at_risk} covenant(s) at risk
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="py-12">
          <CardContent className="text-center">
            <Building2 className="w-12 h-12 mx-auto text-zinc-300 mb-4" />
            <p className="text-zinc-500">No facilities found matching your filters.</p>
            <Button className="mt-4">
              <Plus className="w-4 h-4 mr-2" />
              Add First Facility
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
