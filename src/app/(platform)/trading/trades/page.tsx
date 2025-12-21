'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { ArrowLeftRight, Search, Filter, Plus } from 'lucide-react';
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
import { TradeCard, createDiverseTradeSet, resetIdCounter } from '@/app/features/trading';

// Generate a diverse set of trades covering all statuses for the list page
resetIdCounter(2000);
const tradesData = createDiverseTradeSet();

export default function TradesListPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredTrades = tradesData.filter((trade) => {
    const matchesSearch =
      !searchQuery ||
      trade.trade_reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
      trade.facility_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      trade.borrower_name.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === 'all' ||
      trade.status === statusFilter ||
      (statusFilter === 'active' && !['settled', 'cancelled', 'failed'].includes(trade.status)) ||
      (statusFilter === 'needs_attention' && (trade.flagged_items > 0 || trade.open_questions > 0));

    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: tradesData.length,
    active: tradesData.filter((t) => !['settled', 'cancelled', 'failed'].includes(t.status)).length,
    inDD: tradesData.filter((t) => t.status === 'in_due_diligence').length,
    pendingSettlement: tradesData.filter((t) => t.status === 'pending_settlement').length,
    settled: tradesData.filter((t) => t.status === 'settled').length,
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Trade Blotter</h1>
          <p className="text-zinc-500">View and manage all trades</p>
        </div>
        <Link href="/trading/trades/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            New Trade
          </Button>
        </Link>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setStatusFilter('all')}>
          <CardContent className="pt-4 pb-4">
            <p className="text-sm text-zinc-500">Total Trades</p>
            <p className="text-2xl font-bold text-zinc-900">{stats.total}</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setStatusFilter('active')}>
          <CardContent className="pt-4 pb-4">
            <p className="text-sm text-blue-600">Active</p>
            <p className="text-2xl font-bold text-blue-600">{stats.active}</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setStatusFilter('in_due_diligence')}>
          <CardContent className="pt-4 pb-4">
            <p className="text-sm text-purple-600">In DD</p>
            <p className="text-2xl font-bold text-purple-600">{stats.inDD}</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setStatusFilter('pending_settlement')}>
          <CardContent className="pt-4 pb-4">
            <p className="text-sm text-amber-600">Pending Settlement</p>
            <p className="text-2xl font-bold text-amber-600">{stats.pendingSettlement}</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setStatusFilter('settled')}>
          <CardContent className="pt-4 pb-4">
            <p className="text-sm text-green-600">Settled</p>
            <p className="text-2xl font-bold text-green-600">{stats.settled}</p>
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
                placeholder="Search trades..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Trades</SelectItem>
                <SelectItem value="active">Active Only</SelectItem>
                <SelectItem value="needs_attention">Needs Attention</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="agreed">Agreed</SelectItem>
                <SelectItem value="in_due_diligence">In Due Diligence</SelectItem>
                <SelectItem value="documentation">Documentation</SelectItem>
                <SelectItem value="pending_consent">Pending Consent</SelectItem>
                <SelectItem value="pending_settlement">Pending Settlement</SelectItem>
                <SelectItem value="settled">Settled</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Trades List */}
      <Card>
        <CardContent className="pt-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-zinc-900">Trades ({filteredTrades.length})</h3>
            <p className="text-sm text-zinc-500">
              {statusFilter === 'all'
                ? 'All trades'
                : statusFilter === 'active'
                ? 'Active trades'
                : `Filtered by ${statusFilter.replace('_', ' ')}`}
            </p>
          </div>
          {filteredTrades.length > 0 ? (
            <div className="space-y-3">
              {filteredTrades.map((trade) => (
                <TradeCard key={trade.id} trade={trade} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <ArrowLeftRight className="w-12 h-12 mx-auto text-zinc-300 mb-4" />
              <h3 className="text-lg font-medium text-zinc-900 mb-2">No trades found</h3>
              <p className="text-zinc-500 mb-4">
                {searchQuery || statusFilter !== 'all'
                  ? 'Try adjusting your search or filters'
                  : 'Get started by creating your first trade'}
              </p>
              <Link href="/trading/trades/new">
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  New Trade
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
