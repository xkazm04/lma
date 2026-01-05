'use client';

import React, { memo, useState } from 'react';
import {
  Library,
  Check,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Minus,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Lightbulb,
  BookOpen,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type {
  ChangeClauseMatch,
  ClauseMatchResult,
  MatchStrength,
  ClauseFavor,
  ClauseTemplate,
} from '../lib/clause-library-types';
import {
  MATCH_STRENGTH_CONFIG,
  CLAUSE_FAVOR_CONFIG,
  CLAUSE_SOURCE_CONFIG,
} from '../lib/clause-library-types';

// ============================================
// Compact Match Badge (for inline use)
// ============================================

interface ClauseMatchBadgeProps {
  match: ClauseMatchResult;
  compact?: boolean;
  onClick?: () => void;
}

export const ClauseMatchBadge = memo(function ClauseMatchBadge({
  match,
  compact = false,
  onClick,
}: ClauseMatchBadgeProps) {
  if (!match.matchedClause) return null;

  const strengthConfig = MATCH_STRENGTH_CONFIG[match.matchStrength];
  const favorConfig = CLAUSE_FAVOR_CONFIG[match.matchedClause.favor];
  const FavorIcon =
    match.matchedClause.favor === 'lender'
      ? TrendingDown
      : match.matchedClause.favor === 'borrower'
      ? TrendingUp
      : Minus;

  if (compact) {
    return (
      <Badge
        variant="secondary"
        className={cn(
          'text-[10px] h-5 px-1.5 cursor-pointer hover:opacity-80 transition-opacity',
          strengthConfig.bgColor,
          strengthConfig.color
        )}
        onClick={onClick}
        data-testid="clause-match-badge-compact"
      >
        <Library className="w-3 h-3 mr-0.5" />
        {match.matchStrength === 'exact' && <Check className="w-3 h-3 mr-0.5" />}
        {match.matchStrength === 'deviation' && <AlertTriangle className="w-3 h-3 mr-0.5" />}
        {Math.round(match.similarityScore * 100)}%
      </Badge>
    );
  }

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-1 rounded-md border cursor-pointer hover:shadow-sm transition-shadow',
        strengthConfig.bgColor,
        `border-${strengthConfig.color.replace('text-', '')}-200`
      )}
      onClick={onClick}
      data-testid="clause-match-badge"
    >
      <Library className={cn('w-3.5 h-3.5', strengthConfig.color)} />
      <span className={cn('text-xs font-medium', strengthConfig.color)}>
        {strengthConfig.label}
      </span>
      <Badge
        variant="secondary"
        className={cn('text-[10px] h-4 px-1', favorConfig.bgColor, favorConfig.color)}
      >
        <FavorIcon className="w-2.5 h-2.5" />
      </Badge>
    </div>
  );
});

// ============================================
// Detailed Match Card (expandable)
// ============================================

interface ClauseMatchCardProps {
  match: ChangeClauseMatch;
  className?: string;
  defaultExpanded?: boolean;
  onInsertClause?: (clauseId: string) => void;
}

export const ClauseMatchCard = memo(function ClauseMatchCard({
  match,
  className,
  defaultExpanded = false,
  onInsertClause,
}: ClauseMatchCardProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const doc2Match = match.doc2Match;
  if (!doc2Match?.matchedClause) return null;

  const strengthConfig = MATCH_STRENGTH_CONFIG[doc2Match.matchStrength];
  const clause = doc2Match.matchedClause;
  const favorConfig = CLAUSE_FAVOR_CONFIG[clause.favor];
  const FavorIcon =
    clause.favor === 'lender'
      ? TrendingDown
      : clause.favor === 'borrower'
      ? TrendingUp
      : Minus;

  const changeAnalysis = match.changeAnalysis;

  return (
    <div
      className={cn(
        'rounded-lg border overflow-hidden transition-all',
        strengthConfig.bgColor,
        `border-${strengthConfig.color.replace('text-', '')}-200`,
        className
      )}
      data-testid={`clause-match-card-${match.changeId}`}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-white/30 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <Library className={cn('w-4 h-4', strengthConfig.color)} />
          <span className={cn('text-sm font-medium', strengthConfig.color)}>
            {strengthConfig.label}
          </span>
          <Badge
            variant="secondary"
            className="text-xs bg-white/70"
          >
            {Math.round(doc2Match.similarityScore * 100)}% match
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            variant="secondary"
            className={cn('text-xs', favorConfig.bgColor, favorConfig.color)}
          >
            <FavorIcon className="w-3 h-3 mr-0.5" />
            {favorConfig.label}
          </Badge>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-zinc-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-zinc-400" />
          )}
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-3 pb-3 space-y-3 bg-white/50">
          {/* Matched Clause Info */}
          <div className="p-2 bg-white rounded border border-zinc-200">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-zinc-700">{clause.name}</span>
              <span className="text-[10px] text-zinc-500">
                {CLAUSE_SOURCE_CONFIG[clause.source].label}
              </span>
            </div>
            <p className="text-xs text-zinc-600">{clause.description}</p>
          </div>

          {/* Analysis */}
          <div className="text-xs text-zinc-700">
            <div className="flex items-start gap-1.5">
              <Lightbulb className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
              <p>{doc2Match.analysis}</p>
            </div>
          </div>

          {/* Differences */}
          {doc2Match.differences.length > 0 && (
            <div>
              <div className="text-xs font-medium text-zinc-700 mb-1 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 text-amber-500" />
                Key Differences
              </div>
              <ul className="text-xs text-zinc-600 space-y-0.5">
                {doc2Match.differences.map((diff, i) => (
                  <li key={i} className="flex items-start gap-1">
                    <span className="text-zinc-400">•</span>
                    {diff}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Change Direction (if analyzing both docs) */}
          {changeAnalysis && (
            <ChangeDirectionIndicator analysis={changeAnalysis} />
          )}

          {/* Suggested Alternatives */}
          {doc2Match.suggestedAlternatives.length > 0 && (
            <div>
              <div className="text-xs font-medium text-zinc-700 mb-1 flex items-center gap-1">
                <BookOpen className="w-3 h-3 text-indigo-500" />
                Alternative Clauses
              </div>
              <div className="space-y-1">
                {doc2Match.suggestedAlternatives.slice(0, 2).map((alt) => (
                  <AlternativeClauseRow
                    key={alt.id}
                    clause={alt}
                    onInsert={onInsertClause}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Insert Button */}
          {onInsertClause && (
            <Button
              size="sm"
              variant="outline"
              className="w-full text-xs"
              onClick={() => onInsertClause(clause.id)}
              data-testid="insert-matched-clause-btn"
            >
              <BookOpen className="w-3 h-3 mr-1" />
              Use Standard Clause
            </Button>
          )}
        </div>
      )}
    </div>
  );
});

// ============================================
// Change Direction Indicator
// ============================================

interface ChangeDirectionIndicatorProps {
  analysis: {
    direction: 'toward_standard' | 'away_from_standard' | 'neutral_change';
    favorChange: {
      from: ClauseFavor | null;
      to: ClauseFavor | null;
    };
    summary: string;
  };
}

const ChangeDirectionIndicator = memo(function ChangeDirectionIndicator({
  analysis,
}: ChangeDirectionIndicatorProps) {
  const directionConfig = {
    toward_standard: {
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      label: 'Toward Standard',
    },
    away_from_standard: {
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      label: 'Away from Standard',
    },
    neutral_change: {
      color: 'text-zinc-600',
      bgColor: 'bg-zinc-50',
      label: 'Neutral Change',
    },
  };

  const config = directionConfig[analysis.direction];

  const getFavorIcon = (favor: ClauseFavor | null) => {
    if (!favor) return null;
    if (favor === 'lender') return TrendingDown;
    if (favor === 'borrower') return TrendingUp;
    return Minus;
  };

  const FromIcon = getFavorIcon(analysis.favorChange.from);
  const ToIcon = getFavorIcon(analysis.favorChange.to);

  return (
    <div className={cn('p-2 rounded border', config.bgColor, 'border-zinc-200')}>
      <div className="flex items-center justify-between mb-1">
        <span className={cn('text-xs font-medium', config.color)}>
          {config.label}
        </span>
        {analysis.favorChange.from && analysis.favorChange.to && (
          <div className="flex items-center gap-1 text-xs">
            {FromIcon && (
              <Badge
                variant="secondary"
                className={cn('text-[10px] h-4 px-1', CLAUSE_FAVOR_CONFIG[analysis.favorChange.from].bgColor)}
              >
                <FromIcon className="w-2.5 h-2.5" />
              </Badge>
            )}
            <ArrowRight className="w-3 h-3 text-zinc-400" />
            {ToIcon && (
              <Badge
                variant="secondary"
                className={cn('text-[10px] h-4 px-1', CLAUSE_FAVOR_CONFIG[analysis.favorChange.to].bgColor)}
              >
                <ToIcon className="w-2.5 h-2.5" />
              </Badge>
            )}
          </div>
        )}
      </div>
      <p className="text-xs text-zinc-600">{analysis.summary}</p>
    </div>
  );
});

// ============================================
// Alternative Clause Row
// ============================================

interface AlternativeClauseRowProps {
  clause: ClauseTemplate;
  onInsert?: (clauseId: string) => void;
}

const AlternativeClauseRow = memo(function AlternativeClauseRow({
  clause,
  onInsert,
}: AlternativeClauseRowProps) {
  const favorConfig = CLAUSE_FAVOR_CONFIG[clause.favor];
  const FavorIcon =
    clause.favor === 'lender'
      ? TrendingDown
      : clause.favor === 'borrower'
      ? TrendingUp
      : Minus;

  return (
    <div
      className="flex items-center justify-between p-1.5 bg-white rounded border border-zinc-200 hover:border-indigo-200 transition-colors cursor-pointer"
      onClick={() => onInsert?.(clause.id)}
      data-testid={`alternative-clause-${clause.id}`}
    >
      <div className="flex items-center gap-2 min-w-0">
        <Badge
          variant="secondary"
          className={cn('text-[10px] h-4 px-1 flex-shrink-0', favorConfig.bgColor, favorConfig.color)}
        >
          <FavorIcon className="w-2.5 h-2.5" />
        </Badge>
        <span className="text-xs text-zinc-700 truncate">{clause.name}</span>
      </div>
      <Button
        size="sm"
        variant="ghost"
        className="h-5 px-1.5 text-[10px]"
        onClick={(e) => {
          e.stopPropagation();
          onInsert?.(clause.id);
        }}
      >
        Use
      </Button>
    </div>
  );
});

// ============================================
// Inline Match Indicator (for change row)
// ============================================

interface InlineClauseMatchProps {
  matchStrength: MatchStrength;
  favor: ClauseFavor;
  similarityScore: number;
  clauseName: string;
  onClick?: () => void;
}

export const InlineClauseMatch = memo(function InlineClauseMatch({
  matchStrength,
  favor,
  similarityScore,
  clauseName,
  onClick,
}: InlineClauseMatchProps) {
  const strengthConfig = MATCH_STRENGTH_CONFIG[matchStrength];
  const favorConfig = CLAUSE_FAVOR_CONFIG[favor];
  const FavorIcon =
    favor === 'lender'
      ? TrendingDown
      : favor === 'borrower'
      ? TrendingUp
      : Minus;

  return (
    <button
      className={cn(
        'flex items-center gap-1.5 px-2 py-0.5 rounded text-xs transition-all',
        'border hover:shadow-sm',
        strengthConfig.bgColor,
        strengthConfig.color
      )}
      onClick={onClick}
      title={`Matches "${clauseName}" - ${favorConfig.label}`}
      data-testid="inline-clause-match"
    >
      <Library className="w-3 h-3" />
      <FavorIcon className="w-3 h-3" />
      <span className="font-medium">{Math.round(similarityScore * 100)}%</span>
    </button>
  );
});

// ============================================
// Drop Zone for Clause Insertion
// ============================================

interface ClauseDropZoneProps {
  changeId: string;
  onDrop: (clauseId: string, targetChangeId: string) => void;
  isActive: boolean;
  onDragEnter: (changeId: string) => void;
  onDragLeave: () => void;
}

export const ClauseDropZone = memo(function ClauseDropZone({
  changeId,
  onDrop,
  isActive,
  onDragEnter,
  onDragLeave,
}: ClauseDropZoneProps) {
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    onDragEnter(changeId);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    onDragLeave();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const clauseId = e.dataTransfer.getData('text/plain');
    if (clauseId) {
      onDrop(clauseId, changeId);
    }
    onDragLeave();
  };

  return (
    <div
      className={cn(
        'absolute inset-0 rounded-lg border-2 border-dashed transition-all pointer-events-auto',
        isActive
          ? 'border-indigo-400 bg-indigo-50/50'
          : 'border-transparent'
      )}
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      data-testid={`clause-drop-zone-${changeId}`}
    >
      {isActive && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium shadow-lg">
            Drop to replace clause
          </div>
        </div>
      )}
    </div>
  );
});
