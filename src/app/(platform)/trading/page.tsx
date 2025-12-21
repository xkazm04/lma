'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, Plus, BarChart3, Building2, ArrowLeftRight, AlertTriangle, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DashboardStats,
  TradeCard,
  UpcomingSettlements,
  RecentActivity,
  useTradingDashboard,
} from '@/app/features/trading';

export default function TradingDashboardPage() {
  const { data, isLoading, error } = useTradingDashboard();

  if (isLoading) {
    return (
      <div className="space-y-6" data-testid="trading-dashboard-loading">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900">Trading Dashboard</h1>
            <p className="text-zinc-500">Manage positions, trades, and due diligence</p>
          </div>
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-28" />
          </div>
        </div>

        {/* Stats Skeleton */}
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>

        {/* Content Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Skeleton className="h-64" />
          </div>
          <Skeleton className="h-64" />
        </div>

        <Skeleton className="h-40" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-64" data-testid="trading-dashboard-error">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-zinc-900">Unable to load dashboard</h2>
          <p className="text-zinc-500 mt-1">{error || 'Please try again later'}</p>
        </div>
      </div>
    );
  }

  const { trades_in_progress, upcoming_settlements, recent_activity, ...stats } = data;

  return (
    <div className="space-y-6" data-testid="trading-dashboard">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Trading Dashboard</h1>
          <p className="text-zinc-500">Manage positions, trades, and due diligence</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/trading/positions" data-testid="view-positions-link">
            <Button variant="outline" data-testid="view-positions-btn">
              <BarChart3 className="w-4 h-4 mr-2" />
              View Positions
            </Button>
          </Link>
          <Link href="/trading/trades/new" data-testid="new-trade-link">
            <Button data-testid="new-trade-btn">
              <Plus className="w-4 h-4 mr-2" />
              New Trade
            </Button>
          </Link>
        </div>
      </div>

      {/* Quick Stats */}
      <DashboardStats stats={data} />

      {/* Attention Required */}
      {(stats.flagged_items_count > 0 || stats.open_questions_count > 0) && (
        <Card className="border-amber-200 bg-amber-50/50" data-testid="attention-required-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <AlertTriangle className="w-6 h-6 text-amber-600" />
              <div className="flex-1">
                <h3 className="font-semibold text-amber-800">Attention Required</h3>
                <p className="text-sm text-amber-700">
                  {stats.flagged_items_count} flagged DD items and {stats.open_questions_count} open questions need your attention
                </p>
              </div>
              <Link href="/trading/trades?filter=needs_attention" data-testid="review-attention-link">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-amber-300 text-amber-700 hover:bg-amber-100"
                  data-testid="review-attention-btn"
                >
                  Review Now
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trades In Progress */}
        <div className="lg:col-span-2">
          <Card data-testid="trades-in-progress-card">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-zinc-900">Trades In Progress</h3>
                  <p className="text-sm text-zinc-500">Active trades requiring attention</p>
                </div>
                <Link href="/trading/trades" data-testid="view-all-trades-link">
                  <Button variant="ghost" size="sm" data-testid="view-all-trades-btn">
                    View All
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              </div>
              <div className="space-y-4" data-testid="trades-in-progress-list">
                {trades_in_progress.length > 0 ? (
                  trades_in_progress.map((trade) => (
                    <TradeCard key={trade.id} trade={trade} />
                  ))
                ) : (
                  <div className="text-center py-8 text-zinc-500">
                    <ArrowLeftRight className="w-8 h-8 mx-auto mb-2 text-zinc-300" />
                    <p>No active trades</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Upcoming Settlements */}
        <UpcomingSettlements settlements={upcoming_settlements} />
      </div>

      {/* Recent Activity */}
      <RecentActivity activities={recent_activity} />

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4" data-testid="quick-actions">
        <Link href="/trading/facilities" data-testid="facilities-link">
          <Card className="hover:shadow-md transition-shadow cursor-pointer group" data-testid="facilities-card">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-purple-100 group-hover:bg-purple-200 transition-colors">
                  <Building2 className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-zinc-900">Facility Inventory</h3>
                  <p className="text-sm text-zinc-500">View and manage trade facilities</p>
                </div>
                <ArrowRight className="w-5 h-5 text-zinc-400 ml-auto group-hover:translate-x-1 transition-transform" />
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/trading/positions" data-testid="positions-link">
          <Card className="hover:shadow-md transition-shadow cursor-pointer group" data-testid="positions-card">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-blue-100 group-hover:bg-blue-200 transition-colors">
                  <BarChart3 className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-zinc-900">Position Book</h3>
                  <p className="text-sm text-zinc-500">Track lender positions</p>
                </div>
                <ArrowRight className="w-5 h-5 text-zinc-400 ml-auto group-hover:translate-x-1 transition-transform" />
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/trading/trades" data-testid="trades-link">
          <Card className="hover:shadow-md transition-shadow cursor-pointer group" data-testid="trades-card">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-green-100 group-hover:bg-green-200 transition-colors">
                  <ArrowLeftRight className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-zinc-900">Trade Blotter</h3>
                  <p className="text-sm text-zinc-500">View all trades and DD status</p>
                </div>
                <ArrowRight className="w-5 h-5 text-zinc-400 ml-auto group-hover:translate-x-1 transition-transform" />
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
