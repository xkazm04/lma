'use client';

import React, { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  RefreshCw,
  Activity,
  Newspaper,
  BarChart3,
  Wallet,
} from 'lucide-react';
import { cn, formatTimeAgo, getSignalStrengthColor } from '@/lib/utils';
import type {
  MarketSignal,
  TransactionPatternSignal,
  NewsSentimentSignal,
  BenchmarkSignal,
} from '../lib/types';

interface SignalFeedProps {
  marketSignals: MarketSignal[];
  transactionPatterns: TransactionPatternSignal[];
  newsSentiment: NewsSentimentSignal[];
  benchmarks: BenchmarkSignal[];
  onRefresh?: () => void;
}

function getDirectionIcon(direction: 'positive' | 'negative' | 'neutral') {
  switch (direction) {
    case 'positive':
      return <TrendingUp className="w-4 h-4 text-green-600" />;
    case 'negative':
      return <TrendingDown className="w-4 h-4 text-red-600" />;
    case 'neutral':
      return <Minus className="w-4 h-4 text-zinc-500" />;
  }
}

const MarketSignalItem = memo(function MarketSignalItem({
  signal,
}: {
  signal: MarketSignal;
}) {
  return (
    <div
      className="flex items-start gap-3 p-3 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 transition-colors"
      data-testid={`market-signal-${signal.id}`}
    >
      <div
        className={cn(
          'p-2 rounded-lg shrink-0',
          signal.direction === 'negative' ? 'bg-red-100' : 'bg-green-100'
        )}
      >
        <Activity
          className={cn(
            'w-4 h-4',
            signal.direction === 'negative' ? 'text-red-600' : 'text-green-600'
          )}
        />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-zinc-900 truncate">
            {signal.data_point}
          </span>
          <Badge className={cn('text-xs', getSignalStrengthColor(signal.signal_strength))}>
            {signal.signal_strength}
          </Badge>
        </div>
        <p className="text-xs text-zinc-600 mt-1 line-clamp-2">
          {signal.description}
        </p>
        <div className="flex items-center gap-3 mt-2 text-xs text-zinc-500">
          <span className="flex items-center gap-1">
            {getDirectionIcon(signal.direction)}
            {signal.change_percentage > 0 ? '+' : ''}
            {signal.change_percentage}%
          </span>
          <span>{formatTimeAgo(signal.timestamp)}</span>
          <span>{signal.confidence}% confidence</span>
        </div>
      </div>
    </div>
  );
});

const TransactionPatternItem = memo(function TransactionPatternItem({
  pattern,
}: {
  pattern: TransactionPatternSignal;
}) {
  return (
    <div
      className="flex items-start gap-3 p-3 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 transition-colors"
      data-testid={`txn-pattern-${pattern.id}`}
    >
      <div
        className={cn(
          'p-2 rounded-lg shrink-0',
          pattern.trend_direction === 'declining' ? 'bg-red-100' : 'bg-green-100'
        )}
      >
        <Wallet
          className={cn(
            'w-4 h-4',
            pattern.trend_direction === 'declining' ? 'text-red-600' : 'text-green-600'
          )}
        />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-zinc-900">
            {pattern.borrower_name}
          </span>
          <Badge
            className={cn(
              'text-xs',
              pattern.trend_direction === 'declining'
                ? 'bg-red-100 text-red-700'
                : pattern.trend_direction === 'improving'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-zinc-100 text-zinc-700'
            )}
          >
            {pattern.trend_direction}
          </Badge>
        </div>
        <p className="text-xs text-zinc-600 mt-1 line-clamp-2">
          {pattern.pattern_description}
        </p>
        <div className="flex items-center gap-3 mt-2 text-xs text-zinc-500">
          <span className="capitalize">{pattern.pattern_type.replace('_', ' ')}</span>
          <span>Risk: {pattern.risk_contribution}%</span>
          <span className="capitalize">{pattern.data_freshness}</span>
        </div>
      </div>
    </div>
  );
});

const NewsSentimentItem = memo(function NewsSentimentItem({
  news,
}: {
  news: NewsSentimentSignal;
}) {
  return (
    <div
      className="flex items-start gap-3 p-3 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 transition-colors"
      data-testid={`news-sentiment-${news.id}`}
    >
      <div
        className={cn(
          'p-2 rounded-lg shrink-0',
          news.sentiment_score < -0.3
            ? 'bg-red-100'
            : news.sentiment_score > 0.3
              ? 'bg-green-100'
              : 'bg-zinc-100'
        )}
      >
        <Newspaper
          className={cn(
            'w-4 h-4',
            news.sentiment_score < -0.3
              ? 'text-red-600'
              : news.sentiment_score > 0.3
                ? 'text-green-600'
                : 'text-zinc-600'
          )}
        />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-zinc-900 line-clamp-2">
          {news.article_title}
        </p>
        <p className="text-xs text-zinc-600 mt-1 line-clamp-2">
          {news.article_summary}
        </p>
        <div className="flex items-center gap-3 mt-2 text-xs text-zinc-500">
          <Badge
            className={cn(
              'text-xs',
              news.sentiment_label.includes('negative')
                ? 'bg-red-100 text-red-700'
                : news.sentiment_label.includes('positive')
                  ? 'bg-green-100 text-green-700'
                  : 'bg-zinc-100 text-zinc-700'
            )}
          >
            {news.sentiment_label.replace('_', ' ')}
          </Badge>
          <span>{news.source_name}</span>
          <span>{formatTimeAgo(news.published_at)}</span>
        </div>
      </div>
    </div>
  );
});

const BenchmarkSignalItem = memo(function BenchmarkSignalItem({
  benchmark,
}: {
  benchmark: BenchmarkSignal;
}) {
  return (
    <div
      className="flex items-start gap-3 p-3 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 transition-colors"
      data-testid={`benchmark-signal-${benchmark.id}`}
    >
      <div
        className={cn(
          'p-2 rounded-lg shrink-0',
          benchmark.requires_attention ? 'bg-amber-100' : 'bg-blue-100'
        )}
      >
        <BarChart3
          className={cn(
            'w-4 h-4',
            benchmark.requires_attention ? 'text-amber-600' : 'text-blue-600'
          )}
        />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-zinc-900 capitalize">
            {benchmark.industry.replace('_', ' ')}
          </span>
          <Badge className="text-xs bg-blue-100 text-blue-700 capitalize">
            {benchmark.covenant_type.replace('_', ' ')}
          </Badge>
        </div>
        <p className="text-xs text-zinc-600 mt-1">
          Market median: {benchmark.current_median}x ({benchmark.change_percentage > 0 ? '+' : ''}
          {benchmark.change_percentage.toFixed(1)}%)
        </p>
        <div className="flex items-center gap-3 mt-2 text-xs text-zinc-500">
          <span className="capitalize">Trend: {benchmark.market_trend}</span>
          <span>Your position: P{benchmark.percentile_rank}</span>
          {benchmark.requires_attention && (
            <span className="text-amber-600 font-medium">Needs attention</span>
          )}
        </div>
      </div>
    </div>
  );
});

export const SignalFeed = memo(function SignalFeed({
  marketSignals,
  transactionPatterns,
  newsSentiment,
  benchmarks,
  onRefresh,
}: SignalFeedProps) {
  const allSignals = [
    ...marketSignals.map(s => ({ type: 'market' as const, data: s, time: s.timestamp })),
    ...transactionPatterns.map(s => ({ type: 'transaction' as const, data: s, time: s.detected_at })),
    ...newsSentiment.map(s => ({ type: 'news' as const, data: s, time: s.published_at })),
  ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

  return (
    <Card data-testid="signal-feed">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div>
          <CardTitle className="text-base">Live Signal Feed</CardTitle>
          <CardDescription>Real-time intelligence from multiple sources</CardDescription>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          data-testid="refresh-signals-btn"
        >
          <RefreshCw className="w-4 h-4 mr-1" />
          Refresh
        </Button>
      </CardHeader>
      <CardContent className="space-y-3 max-h-[600px] overflow-y-auto">
        {/* Benchmarks Section */}
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">
            Industry Benchmarks
          </h4>
          {benchmarks.slice(0, 2).map((b) => (
            <BenchmarkSignalItem key={b.id} benchmark={b} />
          ))}
        </div>

        {/* Live Signals */}
        <div className="space-y-2 pt-3 border-t border-zinc-200">
          <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">
            Latest Signals
          </h4>
          {allSignals.slice(0, 8).map((signal, idx) => {
            switch (signal.type) {
              case 'market':
                return (
                  <MarketSignalItem
                    key={`market-${idx}`}
                    signal={signal.data as MarketSignal}
                  />
                );
              case 'transaction':
                return (
                  <TransactionPatternItem
                    key={`txn-${idx}`}
                    pattern={signal.data as TransactionPatternSignal}
                  />
                );
              case 'news':
                return (
                  <NewsSentimentItem
                    key={`news-${idx}`}
                    news={signal.data as NewsSentimentSignal}
                  />
                );
            }
          })}
        </div>
      </CardContent>
    </Card>
  );
});

export default SignalFeed;
