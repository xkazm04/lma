'use client';

import React, { memo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Scale,
  AlertTriangle,
  BarChart3,
  Target,
  Lightbulb,
  ChevronRight,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { SeverityScoreMeter } from './RiskScoreBadge';
import type { ComparisonRiskSummary, CategoryRiskSummary, RiskSeverity } from '../../lib/types';

interface RiskScoreSummaryProps {
  summary: ComparisonRiskSummary;
  onCategoryClick?: (category: string) => void;
}

const severityColors: Record<RiskSeverity, string> = {
  low: 'text-green-600',
  medium: 'text-amber-600',
  high: 'text-orange-600',
  critical: 'text-red-600',
};

const severityBgColors: Record<RiskSeverity, string> = {
  low: 'bg-green-50 border-green-200',
  medium: 'bg-amber-50 border-amber-200',
  high: 'bg-orange-50 border-orange-200',
  critical: 'bg-red-50 border-red-200',
};

const directionConfig = {
  borrower_favorable: {
    icon: TrendingUp,
    label: 'Borrower Favorable',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    description: 'Changes predominantly benefit the borrower',
  },
  lender_favorable: {
    icon: TrendingDown,
    label: 'Lender Favorable',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    description: 'Changes predominantly benefit the lender',
  },
  balanced: {
    icon: Scale,
    label: 'Balanced',
    color: 'text-zinc-600',
    bgColor: 'bg-zinc-50',
    description: 'Changes are relatively balanced between parties',
  },
};

export const RiskScoreSummary = memo(function RiskScoreSummary({
  summary,
  onCategoryClick,
}: RiskScoreSummaryProps) {
  const dirConfig = directionConfig[summary.overallDirection];
  const DirIcon = dirConfig.icon;

  return (
    <Card
      className={cn(
        'border-2 animate-in fade-in slide-in-from-bottom-2 duration-300',
        severityBgColors[summary.overallSeverity]
      )}
      data-testid="risk-score-summary"
    >
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className={cn('w-5 h-5', severityColors[summary.overallSeverity])} />
              AI Risk Analysis
            </CardTitle>
            <CardDescription className="mt-1">
              Analyzed {summary.totalChangesAnalyzed} changes as of{' '}
              {new Date(summary.analyzedAt).toLocaleString()}
            </CardDescription>
          </div>
          <div className="text-right">
            <div
              className={cn(
                'text-3xl font-bold',
                severityColors[summary.overallSeverity]
              )}
              data-testid="overall-risk-score"
            >
              {summary.overallRiskScore.toFixed(1)}
            </div>
            <div className="text-sm text-zinc-500">Overall Risk Score</div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Direction */}
        <div
          className={cn(
            'flex items-center gap-3 p-3 rounded-lg',
            dirConfig.bgColor
          )}
        >
          <DirIcon className={cn('w-6 h-6', dirConfig.color)} />
          <div>
            <div className={cn('font-semibold', dirConfig.color)}>
              {dirConfig.label}
            </div>
            <div className="text-sm text-zinc-600">{dirConfig.description}</div>
          </div>
        </div>

        {/* Key Stats */}
        <div className="grid grid-cols-3 gap-4">
          <StatCard
            label="High Risk Changes"
            value={summary.highRiskCount}
            total={summary.totalChangesAnalyzed}
            icon={AlertTriangle}
            color="text-orange-600"
            testId="high-risk-count"
          />
          <StatCard
            label="Market Deviations"
            value={summary.marketDeviationCount}
            total={summary.totalChangesAnalyzed}
            icon={BarChart3}
            color="text-amber-600"
            testId="market-deviation-count"
          />
          <StatCard
            label="Severity Level"
            value={summary.overallSeverity.toUpperCase()}
            icon={Target}
            color={severityColors[summary.overallSeverity]}
            testId="severity-level"
          />
        </div>

        {/* Category Breakdown */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-zinc-700 flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Risk by Category
          </h4>
          <div className="space-y-2">
            {summary.categorySummaries.map((cat) => (
              <CategoryRiskRow
                key={cat.category}
                category={cat}
                onClick={onCategoryClick}
              />
            ))}
          </div>
        </div>

        {/* Key Findings */}
        {summary.keyFindings.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-zinc-700 flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-amber-500" />
              Key Findings
            </h4>
            <ul className="space-y-2">
              {summary.keyFindings.map((finding, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 text-sm text-zinc-600"
                  data-testid={`key-finding-${i}`}
                >
                  <ChevronRight className="w-4 h-4 text-zinc-400 flex-shrink-0 mt-0.5" />
                  {finding}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Executive Summary */}
        <div className="p-4 bg-white/50 rounded-lg border border-zinc-200">
          <h4 className="text-sm font-semibold text-zinc-700 mb-2">Executive Summary</h4>
          <p
            className="text-sm text-zinc-600 leading-relaxed"
            data-testid="executive-summary"
          >
            {summary.executiveSummary}
          </p>
        </div>
      </CardContent>
    </Card>
  );
});

interface StatCardProps {
  label: string;
  value: number | string;
  total?: number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  testId: string;
}

const StatCard = memo(function StatCard({
  label,
  value,
  total,
  icon: Icon,
  color,
  testId,
}: StatCardProps) {
  return (
    <div
      className="p-3 bg-white rounded-lg border border-zinc-200 text-center"
      data-testid={testId}
    >
      <Icon className={cn('w-5 h-5 mx-auto mb-1', color)} />
      <div className={cn('text-xl font-bold', color)}>
        {value}
        {total !== undefined && (
          <span className="text-sm text-zinc-400 font-normal">/{total}</span>
        )}
      </div>
      <div className="text-xs text-zinc-500">{label}</div>
    </div>
  );
});

interface CategoryRiskRowProps {
  category: CategoryRiskSummary;
  onClick?: (category: string) => void;
}

const CategoryRiskRow = memo(function CategoryRiskRow({
  category,
  onClick,
}: CategoryRiskRowProps) {
  const totalChanges =
    category.borrowerFavoredCount +
    category.lenderFavoredCount +
    category.neutralCount;

  return (
    <div
      className={cn(
        'p-3 bg-white rounded-lg border border-zinc-200 hover:border-zinc-300 transition-colors',
        onClick && 'cursor-pointer'
      )}
      onClick={() => onClick?.(category.category)}
      data-testid={`category-risk-${category.category.toLowerCase().replace(/\s+/g, '-')}`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="font-medium text-zinc-700">{category.category}</span>
        <Badge
          variant="secondary"
          className={cn(
            'text-xs',
            category.averageSeverityScore <= 3 && 'bg-green-100 text-green-700',
            category.averageSeverityScore > 3 &&
              category.averageSeverityScore <= 5 &&
              'bg-amber-100 text-amber-700',
            category.averageSeverityScore > 5 &&
              category.averageSeverityScore <= 7 &&
              'bg-orange-100 text-orange-700',
            category.averageSeverityScore > 7 && 'bg-red-100 text-red-700'
          )}
        >
          Avg: {category.averageSeverityScore.toFixed(1)}
        </Badge>
      </div>
      <SeverityScoreMeter score={category.averageSeverityScore} size="sm" showLabel={false} />
      <div className="flex items-center justify-between mt-2 text-xs text-zinc-500">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <TrendingUp className="w-3 h-3 text-blue-500" />
            {category.borrowerFavoredCount} borrower
          </span>
          <span className="flex items-center gap-1">
            <TrendingDown className="w-3 h-3 text-purple-500" />
            {category.lenderFavoredCount} lender
          </span>
          {category.neutralCount > 0 && (
            <span className="flex items-center gap-1">
              <Scale className="w-3 h-3 text-zinc-400" />
              {category.neutralCount} neutral
            </span>
          )}
        </div>
        {category.marketDeviationCount > 0 && (
          <span className="text-amber-600">
            {category.marketDeviationCount}/{totalChanges} deviations
          </span>
        )}
      </div>
    </div>
  );
});

interface CompactRiskSummaryProps {
  overallScore: number;
  severity: RiskSeverity;
  direction: 'borrower_favorable' | 'lender_favorable' | 'balanced';
  highRiskCount: number;
  totalChanges: number;
}

export const CompactRiskSummary = memo(function CompactRiskSummary({
  overallScore,
  severity,
  direction,
  highRiskCount,
  totalChanges,
}: CompactRiskSummaryProps) {
  const dirConfig = directionConfig[direction];
  const DirIcon = dirConfig.icon;

  return (
    <div
      className={cn(
        'flex items-center gap-4 p-3 rounded-lg border',
        severityBgColors[severity]
      )}
      data-testid="compact-risk-summary"
    >
      <div className="flex items-center gap-2">
        <div
          className={cn('text-2xl font-bold', severityColors[severity])}
        >
          {overallScore.toFixed(1)}
        </div>
        <div className="text-xs text-zinc-500">
          <div>Risk</div>
          <div>Score</div>
        </div>
      </div>
      <div className="h-8 w-px bg-zinc-300" />
      <div className="flex items-center gap-1.5">
        <DirIcon className={cn('w-4 h-4', dirConfig.color)} />
        <span className={cn('text-sm font-medium', dirConfig.color)}>
          {dirConfig.label}
        </span>
      </div>
      {highRiskCount > 0 && (
        <>
          <div className="h-8 w-px bg-zinc-300" />
          <div className="flex items-center gap-1.5 text-orange-600">
            <AlertTriangle className="w-4 h-4" />
            <span className="text-sm font-medium">
              {highRiskCount} high risk
            </span>
          </div>
        </>
      )}
      <div className="ml-auto text-xs text-zinc-500">
        {totalChanges} changes analyzed
      </div>
    </div>
  );
});
