'use client';

import React, { memo } from 'react';
import { TrendingUp, TrendingDown, Minus, AlertTriangle, AlertCircle, Info, ShieldAlert } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { RiskSeverity, FavoredParty } from '../../lib/types';

interface RiskScoreBadgeProps {
  score: number;
  severity: RiskSeverity;
  favoredParty: FavoredParty;
  deviatesFromMarket?: boolean;
  riskAnalysis?: string;
  showTooltip?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const severityConfig = {
  low: {
    bgColor: 'bg-green-100',
    textColor: 'text-green-800',
    borderColor: 'border-green-200',
    icon: Info,
    label: 'Low Risk',
  },
  medium: {
    bgColor: 'bg-amber-100',
    textColor: 'text-amber-800',
    borderColor: 'border-amber-200',
    icon: AlertCircle,
    label: 'Medium Risk',
  },
  high: {
    bgColor: 'bg-orange-100',
    textColor: 'text-orange-800',
    borderColor: 'border-orange-200',
    icon: AlertTriangle,
    label: 'High Risk',
  },
  critical: {
    bgColor: 'bg-red-100',
    textColor: 'text-red-800',
    borderColor: 'border-red-200',
    icon: ShieldAlert,
    label: 'Critical Risk',
  },
};

const partyConfig = {
  borrower: {
    icon: TrendingUp,
    label: 'Favors Borrower',
    color: 'text-blue-600',
  },
  lender: {
    icon: TrendingDown,
    label: 'Favors Lender',
    color: 'text-purple-600',
  },
  neutral: {
    icon: Minus,
    label: 'Neutral',
    color: 'text-zinc-500',
  },
};

const sizeConfig = {
  sm: {
    badge: 'px-1.5 py-0.5 text-xs',
    icon: 'w-3 h-3',
    score: 'text-xs',
  },
  md: {
    badge: 'px-2 py-1 text-sm',
    icon: 'w-3.5 h-3.5',
    score: 'text-sm',
  },
  lg: {
    badge: 'px-2.5 py-1.5 text-base',
    icon: 'w-4 h-4',
    score: 'text-base',
  },
};

export const RiskScoreBadge = memo(function RiskScoreBadge({
  score,
  severity,
  favoredParty,
  deviatesFromMarket = false,
  riskAnalysis,
  showTooltip = true,
  size = 'md',
}: RiskScoreBadgeProps) {
  const sevConfig = severityConfig[severity];
  const partyConf = partyConfig[favoredParty];
  const sizeConf = sizeConfig[size];
  const SeverityIcon = sevConfig.icon;
  const PartyIcon = partyConf.icon;

  const badgeContent = (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border font-medium transition-colors',
        sevConfig.bgColor,
        sevConfig.textColor,
        sevConfig.borderColor,
        sizeConf.badge
      )}
      data-testid={`risk-score-badge-${severity}`}
    >
      <SeverityIcon className={sizeConf.icon} />
      <span className={cn('font-bold', sizeConf.score)}>{score}</span>
      <span className="text-zinc-400">/10</span>
      <span className="mx-0.5 text-zinc-300">|</span>
      <PartyIcon className={cn(sizeConf.icon, partyConf.color)} />
      {deviatesFromMarket && (
        <>
          <span className="mx-0.5 text-zinc-300">|</span>
          <span className="text-orange-600 font-medium text-xs">⚡</span>
        </>
      )}
    </div>
  );

  if (!showTooltip || !riskAnalysis) {
    return badgeContent;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{badgeContent}</TooltipTrigger>
        <TooltipContent
          side="top"
          className="max-w-sm p-3 bg-zinc-900 text-white"
          data-testid="risk-score-tooltip"
        >
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-1.5">
                <SeverityIcon className="w-4 h-4" />
                <span className="font-semibold">{sevConfig.label}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <PartyIcon className={cn('w-4 h-4', partyConf.color)} />
                <span className="text-sm">{partyConf.label}</span>
              </div>
            </div>
            {deviatesFromMarket && (
              <div className="flex items-center gap-1.5 text-orange-400 text-sm">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Deviates from market standards</span>
              </div>
            )}
            <p className="text-sm text-zinc-300 leading-relaxed">{riskAnalysis}</p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
});

interface FavoredPartyBadgeProps {
  party: FavoredParty;
  size?: 'sm' | 'md';
}

export const FavoredPartyBadge = memo(function FavoredPartyBadge({
  party,
  size = 'sm',
}: FavoredPartyBadgeProps) {
  const config = partyConfig[party];
  const Icon = config.icon;

  return (
    <Badge
      variant="secondary"
      className={cn(
        'inline-flex items-center gap-1',
        size === 'sm' ? 'px-1.5 py-0.5 text-xs' : 'px-2 py-1 text-sm'
      )}
      data-testid={`favored-party-badge-${party}`}
    >
      <Icon className={cn(size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5', config.color)} />
      <span>{config.label}</span>
    </Badge>
  );
});

interface SeverityScoreMeterProps {
  score: number;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const SeverityScoreMeter = memo(function SeverityScoreMeter({
  score,
  showLabel = true,
  size = 'md',
}: SeverityScoreMeterProps) {
  const percentage = (score / 10) * 100;

  const getColor = (s: number) => {
    if (s <= 3) return 'bg-green-500';
    if (s <= 5) return 'bg-amber-500';
    if (s <= 7) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const heightConfig = {
    sm: 'h-1.5',
    md: 'h-2',
    lg: 'h-2.5',
  };

  return (
    <div className="flex items-center gap-2" data-testid="severity-score-meter">
      <div
        className={cn(
          'flex-1 bg-zinc-200 rounded-full overflow-hidden',
          heightConfig[size]
        )}
      >
        <div
          className={cn('h-full rounded-full transition-all duration-300', getColor(score))}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-sm font-medium text-zinc-700 min-w-[2rem] text-right">
          {score}/10
        </span>
      )}
    </div>
  );
});
