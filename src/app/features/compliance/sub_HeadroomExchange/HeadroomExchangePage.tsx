'use client';

import React, { memo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  ArrowRightLeft,
  TrendingUp,
  Sparkles,
  Plus,
  Filter,
  Info,
  BarChart3,
} from 'lucide-react';
import {
  HeadroomListingCard,
  TradeProposalCard,
  MarketStatsBar,
  PortfolioOptimizationPanel,
} from './components';
import {
  mockHeadroomListings,
  mockTrades,
  mockTradeRecommendations,
  mockPortfolioOptimization,
  mockMarketStats,
  mockUserDashboard,
} from './lib';

export const HeadroomExchangePage = memo(function HeadroomExchangePage() {
  const [activeTab, setActiveTab] = useState('marketplace');

  const handleProposeTrade = (listingId: string) => {
    console.log('Propose trade for listing:', listingId);
    // TODO: Open trade proposal modal
  };

  const handleAcceptTrade = (tradeId: string) => {
    console.log('Accept trade:', tradeId);
    // TODO: Accept trade logic
  };

  const handleRejectTrade = (tradeId: string) => {
    console.log('Reject trade:', tradeId);
    // TODO: Reject trade logic
  };

  const handleNegotiate = (tradeId: string) => {
    console.log('Negotiate trade:', tradeId);
    // TODO: Open negotiation modal
  };

  return (
    <div className="space-y-4 animate-in fade-in" data-testid="headroom-exchange-page">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold text-zinc-900">Covenant Flexibility Exchange</h1>
            <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white">
              <Sparkles className="w-3 h-3 mr-1" />
              AI-Powered
            </Badge>
          </div>
          <p className="text-zinc-500 max-w-3xl">
            Transform compliance from zero-sum to collaborative. Trade excess covenant headroom for
            pricing adjustments, cross-guarantees, or shared covenants to optimize portfolio-wide
            risk.
          </p>
        </div>
        <Button className="hover:shadow-sm transition-all" data-testid="create-listing-btn">
          <Plus className="w-4 h-4 mr-2" />
          Create Listing
        </Button>
      </div>

      {/* Market stats */}
      <MarketStatsBar stats={mockMarketStats} />

      {/* Portfolio optimization alert */}
      {mockPortfolioOptimization.optimization_opportunity_score >= 70 && (
        <PortfolioOptimizationPanel analysis={mockPortfolioOptimization} />
      )}

      {/* Main content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="marketplace" data-testid="tab-marketplace">
            <ArrowRightLeft className="w-4 h-4 mr-2" />
            Marketplace
          </TabsTrigger>
          <TabsTrigger value="proposals" data-testid="tab-proposals">
            <TrendingUp className="w-4 h-4 mr-2" />
            My Proposals
            {mockUserDashboard.incoming_proposals.length > 0 && (
              <Badge variant="destructive" className="ml-2">
                {mockUserDashboard.incoming_proposals.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="recommendations" data-testid="tab-recommendations">
            <Sparkles className="w-4 h-4 mr-2" />
            AI Matches
          </TabsTrigger>
          <TabsTrigger value="analytics" data-testid="tab-analytics">
            <BarChart3 className="w-4 h-4 mr-2" />
            Analytics
          </TabsTrigger>
        </TabsList>

        {/* Marketplace tab */}
        <TabsContent value="marketplace" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Active Listings</CardTitle>
                <CardDescription>
                  Available headroom for trading across facilities
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" data-testid="filter-listings-btn">
                <Filter className="w-4 h-4 mr-2" />
                Filters
              </Button>
            </CardHeader>
            <CardContent>
              {mockHeadroomListings.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {mockHeadroomListings.map((listing) => (
                    <HeadroomListingCard
                      key={listing.id}
                      listing={listing}
                      onProposeTrade={handleProposeTrade}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <ArrowRightLeft className="w-12 h-12 mx-auto text-zinc-300 mb-3" />
                  <p className="text-zinc-500">No active listings available</p>
                  <Button variant="outline" className="mt-4" data-testid="create-first-listing-btn">
                    <Plus className="w-4 h-4 mr-2" />
                    Create First Listing
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Proposals tab */}
        <TabsContent value="proposals" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Incoming proposals */}
            <Card>
              <CardHeader>
                <CardTitle>Incoming Proposals</CardTitle>
                <CardDescription>Trades proposed to your facilities</CardDescription>
              </CardHeader>
              <CardContent>
                {mockUserDashboard.incoming_proposals.length > 0 ? (
                  <div className="space-y-3">
                    {mockUserDashboard.incoming_proposals.map((trade) => (
                      <TradeProposalCard
                        key={trade.id}
                        trade={trade}
                        onAccept={handleAcceptTrade}
                        onReject={handleRejectTrade}
                        onNegotiate={handleNegotiate}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-sm text-zinc-500">No incoming proposals</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Outgoing proposals */}
            <Card>
              <CardHeader>
                <CardTitle>Outgoing Proposals</CardTitle>
                <CardDescription>Trades you've proposed to others</CardDescription>
              </CardHeader>
              <CardContent>
                {mockUserDashboard.outgoing_proposals.length > 0 ? (
                  <div className="space-y-3">
                    {mockUserDashboard.outgoing_proposals.map((trade) => (
                      <TradeProposalCard key={trade.id} trade={trade} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-sm text-zinc-500">No outgoing proposals</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Active trades */}
          {mockUserDashboard.active_trades.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Active Trades</CardTitle>
                <CardDescription>Accepted trades pending execution</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {mockUserDashboard.active_trades.map((trade) => (
                    <TradeProposalCard key={trade.id} trade={trade} />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* AI Recommendations tab */}
        <TabsContent value="recommendations" className="space-y-4">
          <Card className="border-purple-200 bg-purple-50/30">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-600" />
                <CardTitle className="text-purple-900">AI-Matched Trade Opportunities</CardTitle>
              </div>
              <CardDescription>
                Machine learning analysis of compatible trades based on risk profiles, covenant
                types, and fair value
              </CardDescription>
            </CardHeader>
            <CardContent>
              {mockTradeRecommendations.length > 0 ? (
                <div className="space-y-4">
                  {mockTradeRecommendations.map((recommendation) => (
                    <Card
                      key={recommendation.id}
                      className="border-purple-200 bg-white"
                      data-testid={`recommendation-card-${recommendation.id}`}
                    >
                      <CardContent className="p-4">
                        <div className="space-y-4">
                          {/* Match quality scores */}
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge className="bg-purple-100 text-purple-700">
                              Overall: {recommendation.compatibility_score}
                            </Badge>
                            <Badge variant="outline">Risk: {recommendation.risk_compatibility}</Badge>
                            <Badge variant="outline">
                              Covenant: {recommendation.covenant_compatibility}
                            </Badge>
                            <Badge variant="outline">
                              Timing: {recommendation.timing_compatibility}
                            </Badge>
                            <Badge className="bg-green-100 text-green-700">
                              Mutual Benefit: {recommendation.mutual_benefit_score}
                            </Badge>
                          </div>

                          {/* Facilities */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="bg-zinc-50 rounded-lg p-3">
                              <p className="text-xs text-zinc-500 mb-1">Your Facility</p>
                              <p className="font-semibold text-zinc-900">
                                {mockHeadroomListings.find(
                                  (l) => l.id === recommendation.listing_id
                                )?.facility_name}
                              </p>
                              <p className="text-xs text-zinc-600 mt-1">
                                {mockHeadroomListings.find(
                                  (l) => l.id === recommendation.listing_id
                                )?.covenant_name}
                              </p>
                            </div>
                            <div className="bg-zinc-50 rounded-lg p-3">
                              <p className="text-xs text-zinc-500 mb-1">Matched Facility</p>
                              <p className="font-semibold text-zinc-900">
                                {recommendation.matched_facility_name}
                              </p>
                              <p className="text-xs text-zinc-600 mt-1">
                                {recommendation.matched_covenant_name}
                              </p>
                            </div>
                          </div>

                          {/* Summary */}
                          <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                            <p className="text-sm font-medium text-purple-900 mb-2">
                              {recommendation.recommendation_summary}
                            </p>
                          </div>

                          {/* Rationale */}
                          <div className="space-y-2">
                            <details className="group">
                              <summary className="cursor-pointer text-sm font-medium text-zinc-700 flex items-center gap-2">
                                <Info className="w-4 h-4" />
                                Match Rationale
                              </summary>
                              <p className="text-sm text-zinc-600 mt-2 ml-6">
                                {recommendation.match_rationale}
                              </p>
                            </details>
                            <details className="group">
                              <summary className="cursor-pointer text-sm font-medium text-zinc-700 flex items-center gap-2">
                                <Info className="w-4 h-4" />
                                Risk Assessment
                              </summary>
                              <p className="text-sm text-zinc-600 mt-2 ml-6">
                                {recommendation.risk_assessment}
                              </p>
                            </details>
                          </div>

                          {/* Action */}
                          <Button
                            className="w-full bg-purple-600 hover:bg-purple-700"
                            data-testid={`create-trade-from-rec-${recommendation.id}`}
                          >
                            <Sparkles className="w-4 h-4 mr-2" />
                            Create Trade from Recommendation
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Sparkles className="w-12 h-12 mx-auto text-purple-300 mb-3" />
                  <p className="text-zinc-500">No recommendations available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics tab */}
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* User stats */}
            <Card>
              <CardHeader>
                <CardTitle>Your Trading Activity</CardTitle>
                <CardDescription>Personal statistics and performance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-zinc-50 rounded-lg p-3">
                      <p className="text-xs text-zinc-500 mb-1">Trades Completed</p>
                      <p className="text-2xl font-bold text-zinc-900">
                        {mockUserDashboard.trades_completed_count}
                      </p>
                    </div>
                    <div className="bg-green-50 rounded-lg p-3">
                      <p className="text-xs text-green-700 mb-1">Value Received</p>
                      <p className="text-2xl font-bold text-green-800">
                        ${(mockUserDashboard.total_value_received / 1000).toFixed(0)}K
                      </p>
                    </div>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-3">
                    <p className="text-xs text-blue-700 mb-1">Net Value</p>
                    <p className="text-2xl font-bold text-blue-800">
                      $
                      {(
                        (mockUserDashboard.total_value_received -
                          mockUserDashboard.total_value_given) /
                        1000
                      ).toFixed(0)}
                      K
                    </p>
                    <p className="text-xs text-blue-600 mt-1">
                      Positive return on headroom trading
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Market insights */}
            <Card>
              <CardHeader>
                <CardTitle>Market Insights</CardTitle>
                <CardDescription>Trading patterns and trends</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-zinc-600 mb-2">Most Popular Exchange Type</p>
                    <Badge className="bg-blue-600 text-white capitalize">
                      {mockMarketStats.most_common_exchange_type.replace(/_/g, ' ')}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-zinc-600 mb-2">Most Traded Covenant Types</p>
                    <div className="space-y-2">
                      {mockMarketStats.most_traded_covenant_types.map((item) => (
                        <div
                          key={item.covenant_type}
                          className="flex items-center justify-between bg-zinc-50 rounded p-2"
                        >
                          <span className="text-sm text-zinc-700 capitalize">
                            {item.covenant_type.replace(/_/g, ' ')}
                          </span>
                          <Badge variant="secondary">{item.trade_count} trades</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* How it works */}
          <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200">
            <CardHeader>
              <CardTitle className="text-blue-900">How Headroom Exchange Works</CardTitle>
              <CardDescription>Understanding the marketplace mechanics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-lg p-4 border border-blue-200">
                  <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center mb-3">
                    <span className="text-white font-bold">1</span>
                  </div>
                  <h4 className="font-semibold text-zinc-900 mb-2">List Excess Headroom</h4>
                  <p className="text-sm text-zinc-600">
                    Facilities with significant headroom (e.g., 68% liquidity) list available
                    buffer for trade
                  </p>
                </div>
                <div className="bg-white rounded-lg p-4 border border-purple-200">
                  <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center mb-3">
                    <span className="text-white font-bold">2</span>
                  </div>
                  <h4 className="font-semibold text-zinc-900 mb-2">AI Matching</h4>
                  <p className="text-sm text-zinc-600">
                    Machine learning identifies compatible trades based on risk profiles and fair
                    value calculations
                  </p>
                </div>
                <div className="bg-white rounded-lg p-4 border border-green-200">
                  <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center mb-3">
                    <span className="text-white font-bold">3</span>
                  </div>
                  <h4 className="font-semibold text-zinc-900 mb-2">Exchange Value</h4>
                  <p className="text-sm text-zinc-600">
                    Trade headroom for pricing adjustments, cross-guarantees, or shared covenant
                    structures
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
});
