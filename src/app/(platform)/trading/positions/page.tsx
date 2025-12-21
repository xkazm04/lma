'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { BarChart3, Search, Filter, Building2, AlertTriangle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PositionCard, createPortfolio, resetIdCounter, formatCurrency } from '@/app/features/trading';

// Generate a realistic portfolio of positions for the list page
resetIdCounter(3000);
const positionsData = createPortfolio(6);

export default function PositionsListPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const filteredPositions = positionsData.filter((position) => {
    const matchesSearch =
      !searchQuery ||
      position.facility_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      position.borrower_name.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || position.facility_status === statusFilter;
    const matchesType = typeFilter === 'all' || position.position_type === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  // Calculate portfolio totals
  const portfolioTotals = positionsData.reduce(
    (acc, pos) => ({
      commitment: acc.commitment + pos.commitment_amount,
      funded: acc.funded + pos.funded_amount,
      unfunded: acc.unfunded + pos.unfunded_amount,
      markToMarket: acc.markToMarket + (pos.funded_amount * (pos.current_price / 100)),
      costBasis: acc.costBasis + (pos.funded_amount * (pos.acquisition_price / 100)),
    }),
    { commitment: 0, funded: 0, unfunded: 0, markToMarket: 0, costBasis: 0 }
  );

  const unrealizedPL = portfolioTotals.markToMarket - portfolioTotals.costBasis;
  const unrealizedPLPercent = ((unrealizedPL / portfolioTotals.costBasis) * 100).toFixed(2);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Position Book</h1>
          <p className="text-zinc-500">Track and manage lender positions</p>
        </div>
        <Link href="/trading/facilities">
          <Button variant="outline">
            <Building2 className="w-4 h-4 mr-2" />
            View Facilities
          </Button>
        </Link>
      </div>

      {/* Portfolio Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-sm text-zinc-500">Total Commitment</p>
            <p className="text-2xl font-bold text-zinc-900">{formatCurrency(portfolioTotals.commitment)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-sm text-zinc-500">Funded Amount</p>
            <p className="text-2xl font-bold text-zinc-900">{formatCurrency(portfolioTotals.funded)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-sm text-zinc-500">Unfunded Amount</p>
            <p className="text-2xl font-bold text-zinc-900">{formatCurrency(portfolioTotals.unfunded)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-sm text-zinc-500">Mark-to-Market</p>
            <p className="text-2xl font-bold text-zinc-900">{formatCurrency(portfolioTotals.markToMarket)}</p>
          </CardContent>
        </Card>
        <Card className={unrealizedPL >= 0 ? 'border-green-200 bg-green-50/50' : 'border-red-200 bg-red-50/50'}>
          <CardContent className="pt-4 pb-4">
            <p className="text-sm text-zinc-500">Unrealized P&L</p>
            <div className="flex items-center gap-2">
              <p className={`text-2xl font-bold ${unrealizedPL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {unrealizedPL >= 0 ? '+' : ''}{formatCurrency(unrealizedPL)}
              </p>
              <span className={`text-sm ${unrealizedPL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ({unrealizedPL >= 0 ? '+' : ''}{unrealizedPLPercent}%)
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <Input
                placeholder="Search positions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="watchlist">Watchlist</SelectItem>
                <SelectItem value="default">Default</SelectItem>
                <SelectItem value="matured">Matured</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Position Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="agent">Agent</SelectItem>
                <SelectItem value="participant">Participant</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Positions List */}
      <Card>
        <CardContent className="pt-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-zinc-900">
              Positions ({filteredPositions.length})
            </h3>
            <p className="text-sm text-zinc-500">
              {positionsData.length} total positions across{' '}
              {new Set(positionsData.map((p) => p.facility_name)).size} facilities
            </p>
          </div>
          {filteredPositions.length > 0 ? (
            <div className="space-y-3">
              {filteredPositions.map((position) => (
                <PositionCard key={position.id} position={position} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <BarChart3 className="w-12 h-12 mx-auto text-zinc-300 mb-4" />
              <h3 className="text-lg font-medium text-zinc-900 mb-2">No positions found</h3>
              <p className="text-zinc-500">
                {searchQuery || statusFilter !== 'all' || typeFilter !== 'all'
                  ? 'Try adjusting your search or filters'
                  : 'No positions in your portfolio yet'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Risk Alert */}
      {positionsData.some(p => p.facility_status === 'default' || p.facility_status === 'watchlist') && (
        <Card className="border-amber-200 bg-amber-50/50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0" />
              <div>
                <h3 className="font-semibold text-amber-800">Positions Requiring Attention</h3>
                <p className="text-sm text-amber-700 mt-1">
                  {positionsData.filter(p => p.facility_status === 'default').length} position(s) in default,{' '}
                  {positionsData.filter(p => p.facility_status === 'watchlist').length} position(s) on watchlist.
                  Consider reviewing these positions and potential trading opportunities.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
