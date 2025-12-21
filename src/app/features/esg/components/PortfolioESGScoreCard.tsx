'use client';

import React, { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Leaf, Users, Building, Trophy, TrendingUp } from 'lucide-react';
import type { ESGPortfolioScore } from '../lib';

interface PortfolioESGScoreCardProps {
  data: ESGPortfolioScore;
  title?: string;
  description?: string;
}

function getScoreColor(score: number): string {
  if (score >= 80) return 'text-green-600';
  if (score >= 70) return 'text-blue-600';
  if (score >= 60) return 'text-amber-600';
  return 'text-red-600';
}

function getScoreRating(score: number): string {
  if (score >= 90) return 'AAA';
  if (score >= 80) return 'AA';
  if (score >= 70) return 'A';
  if (score >= 60) return 'BBB';
  if (score >= 50) return 'BB';
  return 'B';
}

function getScoreLabel(score: number): string {
  if (score >= 80) return 'Leader';
  if (score >= 70) return 'Above Average';
  if (score >= 60) return 'Average';
  return 'Below Average';
}

function getPercentileColor(percentile: number): string {
  if (percentile >= 75) return 'text-green-600';
  if (percentile >= 50) return 'text-blue-600';
  if (percentile >= 25) return 'text-amber-600';
  return 'text-red-600';
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export const PortfolioESGScoreCard = memo(function PortfolioESGScoreCard({
  data,
  title = 'Portfolio ESG Score',
  description = 'Aggregate sustainability performance',
}: PortfolioESGScoreCardProps) {
  return (
    <Card className="animate-in fade-in slide-in-from-bottom-4 duration-500" data-testid="portfolio-esg-score-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <Badge variant="outline" className="text-xs">
            {data.methodology}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-start gap-4">
          {/* Main Score Circle */}
          <div className="flex flex-col items-center">
            <div className="relative w-32 h-32">
              {/* Background circle */}
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="#e4e4e7"
                  strokeWidth="10"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke={
                    data.overall_score >= 80 ? '#22c55e' :
                    data.overall_score >= 70 ? '#3b82f6' :
                    data.overall_score >= 60 ? '#f59e0b' : '#ef4444'
                  }
                  strokeWidth="10"
                  strokeDasharray={`${data.overall_score * 2.83} 283`}
                  strokeLinecap="round"
                />
              </svg>
              {/* Score text */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-3xl font-bold ${getScoreColor(data.overall_score)}`}>
                  {data.overall_score}
                </span>
                <span className="text-xs text-zinc-500">/ 100</span>
              </div>
            </div>
            <div className="mt-2 text-center">
              <div className={`text-lg font-bold ${getScoreColor(data.overall_score)}`}>
                {getScoreRating(data.overall_score)}
              </div>
              <div className="text-xs text-zinc-500">{getScoreLabel(data.overall_score)}</div>
            </div>
          </div>

          {/* E, S, G Breakdown */}
          <div className="flex-1 space-y-3">
            {/* Environmental */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                <Leaf className="w-5 h-5 text-green-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-zinc-700">Environmental</span>
                  <span className={`font-bold ${getScoreColor(data.environmental_score)}`}>
                    {data.environmental_score}
                  </span>
                </div>
                <div className="h-2 bg-zinc-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 rounded-full transition-all"
                    style={{ width: `${data.environmental_score}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Social */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <Users className="w-5 h-5 text-purple-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-zinc-700">Social</span>
                  <span className={`font-bold ${getScoreColor(data.social_score)}`}>
                    {data.social_score}
                  </span>
                </div>
                <div className="h-2 bg-zinc-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-purple-500 rounded-full transition-all"
                    style={{ width: `${data.social_score}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Governance */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Building className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-zinc-700">Governance</span>
                  <span className={`font-bold ${getScoreColor(data.governance_score)}`}>
                    {data.governance_score}
                  </span>
                </div>
                <div className="h-2 bg-zinc-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full transition-all"
                    style={{ width: `${data.governance_score}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Peer Comparison */}
        <div className="mt-4 pt-3 border-t border-zinc-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-500" />
              <span className="text-sm font-medium text-zinc-700">Peer Comparison</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-xs text-zinc-500">Rank</div>
                <div className="font-semibold text-zinc-900">
                  #{data.peer_comparison.rank} of {data.peer_comparison.total_peers}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-zinc-500">Percentile</div>
                <div className={`font-semibold ${getPercentileColor(data.peer_comparison.percentile)}`}>
                  {data.peer_comparison.percentile}th
                </div>
              </div>
            </div>
          </div>

          {/* Percentile Bar */}
          <div className="mt-3 relative h-3 bg-zinc-100 rounded-full overflow-hidden">
            <div
              className="absolute h-full bg-gradient-to-r from-red-400 via-amber-400 via-blue-400 to-green-400"
              style={{ width: '100%' }}
            />
            <div
              className="absolute top-0 h-full w-1 bg-zinc-900"
              style={{ left: `${data.peer_comparison.percentile}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-zinc-400 mt-1">
            <span>Bottom 25%</span>
            <span>Average</span>
            <span>Top 25%</span>
          </div>
        </div>

        {/* Last Updated */}
        <div className="mt-4 text-xs text-zinc-400 text-right">
          Last updated: {formatDate(data.last_updated)}
        </div>
      </CardContent>
    </Card>
  );
});
