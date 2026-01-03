'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Plus,
  ArrowLeftRight,
  AlertTriangle,
  Search,
  Timer,
  Clock,
  CheckCircle,
  BarChart3,
  TrendingUp,
  TrendingDown,
  MoreVertical,
  FileText,
  ExternalLink,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
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
import { DemoCard } from '@/lib/demo-guide';
import { cn } from '@/lib/utils';
import { InlineEdit } from '@/components/ui/inline-edit';
import { Sparkline, generateSparklineData } from '@/components/ui/sparkline';
import {
  useTradingDashboard,
  createDiverseTradeSet,
  createPortfolio,
  resetIdCounter,
  formatCurrency,
  formatDate,
  getDaysUntil,
  getStatusLabel,
  getStatusBadgeVariant,
} from '@/app/features/trading';
import type { Trade, Position, Settlement, Activity } from '@/app/features/trading/lib/types';

// Generate mock data
resetIdCounter(2000);
const tradesData = createDiverseTradeSet();
resetIdCounter(3000);
const positionsData = createPortfolio(6).map((position) => ({
  ...position,
  // Generate price history based on acquisition and current price
  priceHistory: generateSparklineData(12, {
    min: Math.min(position.acquisition_price, position.current_price) - 5,
    max: Math.max(position.acquisition_price, position.current_price) + 5,
    startValue: position.acquisition_price,
    trend: position.current_price > position.acquisition_price ? 'up' : position.current_price < position.acquisition_price ? 'down' : 'volatile',
  }),
}));

type DataTab = 'trades' | 'positions';

export default function TradingDashboardPage() {
  const { data, isLoading } = useTradingDashboard();
  const [dataTab, setDataTab] = useState<DataTab>('trades');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Filter trades
  const filteredTrades = useMemo(() => {
    return tradesData.filter((trade) => {
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
  }, [searchQuery, statusFilter]);

  // Filter positions
  const filteredPositions = useMemo(() => {
    return positionsData.filter((position) => {
      const matchesSearch =
        !searchQuery ||
        position.facility_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        position.borrower_name.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === 'all' || position.facility_status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [searchQuery, statusFilter]);

  // Stats calculations
  const tradeStats = {
    total: tradesData.length,
    active: tradesData.filter((t) => !['settled', 'cancelled', 'failed'].includes(t.status)).length,
    inDD: tradesData.filter((t) => t.status === 'in_due_diligence').length,
    pendingSettlement: tradesData.filter((t) => t.status === 'pending_settlement').length,
  };

  const positionTotals = positionsData.reduce(
    (acc, pos) => ({
      funded: acc.funded + pos.funded_amount,
      markToMarket: acc.markToMarket + pos.funded_amount * (pos.current_price / 100),
      costBasis: acc.costBasis + pos.funded_amount * (pos.acquisition_price / 100),
    }),
    { funded: 0, markToMarket: 0, costBasis: 0 }
  );
  const unrealizedPL = positionTotals.markToMarket - positionTotals.costBasis;

  const settlements = data?.upcoming_settlements ?? [];
  const activities = data?.recent_activity ?? [];

  if (isLoading) {
    return (
      <PageContainer>
        <div className="space-y-4 animate-pulse">
          <div className="h-8 bg-zinc-200 rounded w-48" />
          <div className="h-20 bg-zinc-200 rounded" />
          <div className="grid grid-cols-3 gap-4">
            <div className="h-64 bg-zinc-200 rounded col-span-2" />
            <div className="h-64 bg-zinc-200 rounded" />
          </div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-zinc-900">Trading</h1>
            <p className="text-sm text-zinc-500">Manage positions, trades, and due diligence</p>
          </div>
          <Link href="/trading/trades/new">
            <Button size="sm" className="h-8 text-xs">
              <Plus className="w-3.5 h-3.5 mr-1.5" />
              New Trade
            </Button>
          </Link>
        </div>

        {/* Stats Row */}
        <div className="flex flex-wrap items-center gap-2">
          <StatIndicator
            icon={ArrowLeftRight}
            value={tradeStats.active}
            label="Active Trades"
            iconColor="text-blue-500"
          />
          <StatIndicator
            icon={FileText}
            value={tradeStats.inDD}
            label="In DD"
            iconColor="text-purple-500"
          />
          <StatIndicator
            icon={Timer}
            value={tradeStats.pendingSettlement}
            label="Pending"
            iconColor="text-amber-500"
            highlight={tradeStats.pendingSettlement > 0 ? 'warning' : undefined}
          />
          <div className="w-px h-5 bg-zinc-200 mx-1" />
          <StatIndicator
            icon={BarChart3}
            value={formatCurrency(positionTotals.funded)}
            label="Funded"
            iconColor="text-zinc-500"
          />
          <StatIndicator
            icon={unrealizedPL >= 0 ? TrendingUp : TrendingDown}
            value={`${unrealizedPL >= 0 ? '+' : ''}${formatCurrency(unrealizedPL)}`}
            label="P&L"
            iconColor={unrealizedPL >= 0 ? 'text-green-500' : 'text-red-500'}
            highlight={unrealizedPL < 0 ? 'error' : undefined}
          />
        </div>

        {/* Dashboard Cards Row - Explorable Section */}
        <DemoCard sectionId="trading-dashboard" fullWidth>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            {/* Upcoming Settlements */}
            <Card>
              <CardHeader className="py-2.5 px-3 flex flex-row items-center justify-between border-b border-zinc-100">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-md bg-amber-50">
                    <Timer className="w-3.5 h-3.5 text-amber-600" />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-medium">Upcoming Settlements</CardTitle>
                    <CardDescription className="text-[10px]">Next 14 days</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-2 px-2 pb-2">
                {settlements.length > 0 ? (
                  <div className="divide-y divide-zinc-100 max-h-[180px] overflow-y-auto">
                    {settlements.slice(0, 5).map((settlement) => (
                      <SettlementRow key={settlement.trade_id} settlement={settlement} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <Timer className="w-6 h-6 mx-auto text-zinc-300 mb-1" />
                    <p className="text-xs text-zinc-500">No upcoming settlements</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card className="lg:col-span-2">
              <CardHeader className="py-2.5 px-3 border-b border-zinc-100">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-md bg-blue-50">
                    <Clock className="w-3.5 h-3.5 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
                    <CardDescription className="text-[10px]">Latest trading updates</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-2 px-2 pb-2">
                {activities.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5 max-h-[180px] overflow-y-auto">
                    {activities.slice(0, 6).map((activity) => (
                      <ActivityRow key={activity.id} activity={activity} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <Clock className="w-6 h-6 mx-auto text-zinc-300 mb-1" />
                    <p className="text-xs text-zinc-500">No recent activity</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </DemoCard>

        {/* Data Tabs: Trades / Positions - Explorable Section */}
        <DemoCard sectionId="trading-tables" fullWidth>
          <Card>
            <CardContent className="py-2 px-3">
              <div className="flex items-center gap-2 flex-wrap">
                {/* Tab Switcher */}
                <Tabs value={dataTab} onValueChange={(v) => setDataTab(v as DataTab)}>
                  <TabsList className="h-8 p-0.5 bg-zinc-100">
                    <TabsTrigger value="trades" className="h-7 text-xs px-3">
                      <ArrowLeftRight className="w-3.5 h-3.5 mr-1" />
                      Trades ({filteredTrades.length})
                    </TabsTrigger>
                    <TabsTrigger value="positions" className="h-7 text-xs px-3">
                      <BarChart3 className="w-3.5 h-3.5 mr-1" />
                      Positions ({filteredPositions.length})
                    </TabsTrigger>
                  </TabsList>
                </Tabs>

                <div className="w-px h-5 bg-zinc-200" />

                {/* Search */}
                <div className="relative flex-1 max-w-xs">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
                  <Input
                    placeholder={dataTab === 'trades' ? 'Search trades...' : 'Search positions...'}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 h-8 text-xs border-zinc-200"
                  />
                </div>

                {/* Status Filter */}
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-32 h-8 text-xs border-zinc-200">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    {dataTab === 'trades' ? (
                      <>
                        <SelectItem value="all" className="text-xs">All Status</SelectItem>
                        <SelectItem value="active" className="text-xs">Active Only</SelectItem>
                        <SelectItem value="needs_attention" className="text-xs">Needs Attention</SelectItem>
                        <SelectItem value="in_due_diligence" className="text-xs">In DD</SelectItem>
                        <SelectItem value="pending_settlement" className="text-xs">Pending</SelectItem>
                        <SelectItem value="settled" className="text-xs">Settled</SelectItem>
                      </>
                    ) : (
                      <>
                        <SelectItem value="all" className="text-xs">All Status</SelectItem>
                        <SelectItem value="active" className="text-xs">Active</SelectItem>
                        <SelectItem value="watchlist" className="text-xs">Watchlist</SelectItem>
                        <SelectItem value="default" className="text-xs">Default</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
            <div className="overflow-x-auto border-t border-zinc-100">
              {dataTab === 'trades' ? (
                <TradesTable trades={filteredTrades} />
              ) : (
                <PositionsTable positions={filteredPositions} />
              )}
            </div>
          </Card>
        </DemoCard>
      </div>
    </PageContainer>
  );
}

// Stat Indicator Component
function StatIndicator({
  icon: Icon,
  value,
  label,
  iconColor,
  highlight,
}: {
  icon: React.ComponentType<{ className?: string }>;
  value: string | number;
  label: string;
  iconColor: string;
  highlight?: 'warning' | 'error';
}) {
  return (
    <div
      className={cn(
        'flex items-center gap-1.5 px-2.5 py-1.5 rounded-md transition-colors',
        highlight === 'error' && 'bg-red-50 border border-red-200',
        highlight === 'warning' && 'bg-amber-50 border border-amber-200',
        !highlight && 'bg-zinc-50'
      )}
      title={label}
    >
      <Icon className={cn('w-3.5 h-3.5 flex-shrink-0', iconColor)} />
      <span className="text-sm font-semibold text-zinc-900 tabular-nums">{value}</span>
      <span className="text-[10px] text-zinc-500 hidden sm:inline">{label}</span>
    </div>
  );
}

// Settlement Row Component
function SettlementRow({ settlement }: { settlement: Settlement }) {
  const daysUntil = getDaysUntil(settlement.settlement_date);
  return (
    <Link
      href={`/trading/trades/${settlement.trade_id}`}
      className="block py-2 first:pt-0 last:pb-0 hover:bg-zinc-50 -mx-2 px-2 rounded transition-colors"
    >
      <div className="flex items-center gap-2">
        <div className="flex flex-col items-center w-9 py-0.5 px-1 bg-zinc-100 rounded text-center">
          <span className="text-[9px] text-zinc-500">
            {new Date(settlement.settlement_date).toLocaleDateString('en-US', { month: 'short' })}
          </span>
          <span className="text-xs font-bold text-zinc-900">
            {new Date(settlement.settlement_date).getDate()}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-zinc-900 truncate">{settlement.trade_reference}</p>
          <p className="text-[10px] text-zinc-500 truncate">
            {settlement.is_buyer ? 'Buy' : 'Sell'} · {formatCurrency(settlement.amount)}
          </p>
        </div>
        <Badge
          variant={daysUntil <= 3 ? 'destructive' : daysUntil <= 7 ? 'warning' : 'secondary'}
          className="text-[10px] px-1.5 py-0 h-5"
        >
          {daysUntil === 0 ? 'Today' : daysUntil === 1 ? '1d' : `${daysUntil}d`}
        </Badge>
      </div>
    </Link>
  );
}

// Activity Row Component
function ActivityRow({ activity }: { activity: Activity }) {
  return (
    <Link
      href={`/trading/trades/${activity.trade_id}`}
      className="flex items-center gap-2 py-1.5 px-2 rounded hover:bg-zinc-50 transition-colors"
    >
      <div className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-xs text-zinc-900 truncate">{activity.description}</p>
        <p className="text-[10px] text-zinc-500">{activity.trade_reference}</p>
      </div>
    </Link>
  );
}

// Trades Table Component
function TradesTable({ trades }: { trades: Trade[] }) {
  if (trades.length === 0) {
    return (
      <div className="text-center py-12">
        <ArrowLeftRight className="w-10 h-10 mx-auto text-zinc-300 mb-3" />
        <p className="text-sm text-zinc-500">No trades found</p>
      </div>
    );
  }

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-zinc-100 bg-zinc-50/50">
          <th className="text-left py-2.5 px-4 font-medium text-zinc-500 text-xs uppercase tracking-wider">Trade</th>
          <th className="text-left py-2.5 px-3 font-medium text-zinc-500 text-xs uppercase tracking-wider">Status</th>
          <th className="text-right py-2.5 px-3 font-medium text-zinc-500 text-xs uppercase tracking-wider">Amount</th>
          <th className="text-center py-2.5 px-3 font-medium text-zinc-500 text-xs uppercase tracking-wider">Price</th>
          <th className="text-center py-2.5 px-3 font-medium text-zinc-500 text-xs uppercase tracking-wider">DD</th>
          <th className="text-center py-2.5 px-3 font-medium text-zinc-500 text-xs uppercase tracking-wider">Settlement</th>
          <th className="text-center py-2.5 px-3 font-medium text-zinc-500 text-xs uppercase tracking-wider">Alerts</th>
          <th className="py-2.5 px-3 w-10"></th>
        </tr>
      </thead>
      <tbody className="divide-y divide-zinc-100">
        {trades.map((trade) => {
          const hasAlerts = trade.flagged_items > 0 || trade.open_questions > 0;
          return (
            <tr key={trade.id} className="hover:bg-zinc-50/50 transition-colors">
              <td className="py-3 px-4">
                <Link
                  href={`/trading/trades/${trade.id}`}
                  className="font-medium text-zinc-900 hover:text-blue-600 transition-colors"
                >
                  {trade.trade_reference}
                </Link>
                <p className="text-xs text-zinc-500 mt-0.5 truncate max-w-[200px]">
                  {trade.facility_name}
                </p>
              </td>
              <td className="py-3 px-3">
                <Badge variant={getStatusBadgeVariant(trade.status)} className="text-[10px] px-1.5 py-0 h-5">
                  {getStatusLabel(trade.status)}
                </Badge>
              </td>
              <td className="py-3 px-3 text-right font-medium text-zinc-900">
                {formatCurrency(trade.trade_amount)}
              </td>
              <td className="py-3 px-3 text-center text-zinc-600">
                {trade.trade_price.toFixed(2)}
              </td>
              <td className="py-3 px-3 text-center">
                <div className="flex items-center justify-center gap-1">
                  <div className="w-12 h-1.5 bg-zinc-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full"
                      style={{ width: `${trade.dd_progress}%` }}
                    />
                  </div>
                  <span className="text-xs text-zinc-500">{trade.dd_progress}%</span>
                </div>
              </td>
              <td className="py-3 px-3 text-center text-zinc-600 text-xs">
                {formatDate(trade.settlement_date)}
              </td>
              <td className="py-3 px-3 text-center">
                {hasAlerts ? (
                  <div className="flex items-center justify-center gap-1">
                    {trade.flagged_items > 0 && (
                      <div className="flex items-center gap-0.5 text-red-600" title={`${trade.flagged_items} flagged`}>
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span className="text-xs">{trade.flagged_items}</span>
                      </div>
                    )}
                    {trade.open_questions > 0 && (
                      <div className="flex items-center gap-0.5 text-amber-600" title={`${trade.open_questions} questions`}>
                        <Clock className="w-3.5 h-3.5" />
                        <span className="text-xs">{trade.open_questions}</span>
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
                      <Link href={`/trading/trades/${trade.id}`}>
                        <ArrowRight className="w-4 h-4 mr-2" />
                        View Details
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <FileText className="w-4 h-4 mr-2" />
                      DD Checklist
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-red-600">Cancel Trade</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

// Extended position type with price history for sparklines
type PositionWithHistory = Position & { priceHistory: number[] };

// Positions Table Component
function PositionsTable({ positions }: { positions: PositionWithHistory[] }) {
  const [localPositions, setLocalPositions] = React.useState(positions);

  // Update position price
  const handlePriceUpdate = (positionId: string, newPrice: number) => {
    setLocalPositions((prev) =>
      prev.map((p) =>
        p.id === positionId
          ? {
              ...p,
              current_price: newPrice,
              priceHistory: [...p.priceHistory.slice(1), newPrice],
            }
          : p
      )
    );
  };

  if (localPositions.length === 0) {
    return (
      <div className="text-center py-12">
        <BarChart3 className="w-10 h-10 mx-auto text-zinc-300 mb-3" />
        <p className="text-sm text-zinc-500">No positions found</p>
      </div>
    );
  }

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-zinc-100 bg-zinc-50/50">
          <th className="text-left py-2.5 px-4 font-medium text-zinc-500 text-xs uppercase tracking-wider">Position</th>
          <th className="text-left py-2.5 px-3 font-medium text-zinc-500 text-xs uppercase tracking-wider">Status</th>
          <th className="text-right py-2.5 px-3 font-medium text-zinc-500 text-xs uppercase tracking-wider">Funded</th>
          <th className="text-center py-2.5 px-3 font-medium text-zinc-500 text-xs uppercase tracking-wider">Acq Price</th>
          <th className="text-center py-2.5 px-3 font-medium text-zinc-500 text-xs uppercase tracking-wider">Curr Price</th>
          <th className="text-center py-2.5 px-3 font-medium text-zinc-500 text-xs uppercase tracking-wider">Trend</th>
          <th className="text-right py-2.5 px-3 font-medium text-zinc-500 text-xs uppercase tracking-wider">P&L</th>
          <th className="py-2.5 px-3 w-10"></th>
        </tr>
      </thead>
      <tbody className="divide-y divide-zinc-100">
        {localPositions.map((position) => {
          const mtm = position.funded_amount * (position.current_price / 100);
          const cost = position.funded_amount * (position.acquisition_price / 100);
          const pl = mtm - cost;
          const plPct = ((pl / cost) * 100).toFixed(2);

          return (
            <tr key={position.id} className="hover:bg-zinc-50/50 transition-colors">
              <td className="py-3 px-4">
                <p className="font-medium text-zinc-900">{position.facility_name}</p>
                <p className="text-xs text-zinc-500 mt-0.5">{position.borrower_name}</p>
              </td>
              <td className="py-3 px-3">
                <Badge
                  variant={
                    position.facility_status === 'active'
                      ? 'default'
                      : position.facility_status === 'watchlist'
                      ? 'warning'
                      : position.facility_status === 'default'
                      ? 'destructive'
                      : 'secondary'
                  }
                  className={cn(
                    'text-[10px] px-1.5 py-0 h-5',
                    position.facility_status === 'active' && 'bg-green-100 text-green-700 hover:bg-green-100'
                  )}
                >
                  {position.facility_status.charAt(0).toUpperCase() + position.facility_status.slice(1)}
                </Badge>
              </td>
              <td className="py-3 px-3 text-right font-medium text-zinc-900">
                {formatCurrency(position.funded_amount)}
              </td>
              <td className="py-3 px-3 text-center text-zinc-600">
                {position.acquisition_price.toFixed(2)}
              </td>
              <td className="py-3 px-3 text-center">
                <InlineEdit
                  value={position.current_price}
                  type="number"
                  size="sm"
                  onSave={(val) => handlePriceUpdate(position.id, Number(val))}
                  className="justify-center"
                  textClassName="font-medium text-zinc-900"
                />
              </td>
              <td className="py-3 px-3">
                <div className="flex justify-center">
                  <Sparkline
                    data={position.priceHistory}
                    width={72}
                    height={24}
                    strokeColor="auto"
                    fillColor="auto"
                    showEndDot={true}
                    smoothing={0.3}
                  />
                </div>
              </td>
              <td className="py-3 px-3 text-right">
                <span className={cn('font-medium', pl >= 0 ? 'text-green-600' : 'text-red-600')}>
                  {pl >= 0 ? '+' : ''}
                  {formatCurrency(pl)}
                </span>
                <span className={cn('text-xs ml-1', pl >= 0 ? 'text-green-600' : 'text-red-600')}>
                  ({pl >= 0 ? '+' : ''}
                  {plPct}%)
                </span>
              </td>
              <td className="py-3 px-3">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-7 w-7">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>
                      <ExternalLink className="w-4 h-4 mr-2" />
                      View Facility
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <ArrowLeftRight className="w-4 h-4 mr-2" />
                      Create Trade
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
