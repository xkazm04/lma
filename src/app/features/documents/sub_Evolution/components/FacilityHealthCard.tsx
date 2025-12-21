'use client';

import * as React from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Building,
  Calendar,
  ChevronRight,
  TrendingDown,
  TrendingUp,
  Minus,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import type { FacilityEvolutionStatus } from '../lib/types';

interface FacilityHealthCardProps {
  facility: FacilityEvolutionStatus;
  onViewDetails?: (facilityId: string) => void;
  onViewSuggestions?: (facilityId: string) => void;
}

const healthColors = {
  good: { bg: 'bg-green-500', text: 'text-green-600', badge: 'bg-green-100 text-green-700' },
  moderate: { bg: 'bg-amber-500', text: 'text-amber-600', badge: 'bg-amber-100 text-amber-700' },
  poor: { bg: 'bg-red-500', text: 'text-red-600', badge: 'bg-red-100 text-red-700' },
};

const trendIcons = {
  improving: { icon: TrendingUp, color: 'text-green-600' },
  stable: { icon: Minus, color: 'text-zinc-500' },
  deteriorating: { icon: TrendingDown, color: 'text-red-600' },
};

const exposureColors = {
  low: 'bg-green-100 text-green-700',
  minimal: 'bg-green-100 text-green-700',
  medium: 'bg-amber-100 text-amber-700',
  moderate: 'bg-amber-100 text-amber-700',
  high: 'bg-red-100 text-red-700',
  significant: 'bg-red-100 text-red-700',
};

export function FacilityHealthCard({
  facility,
  onViewDetails,
  onViewSuggestions,
}: FacilityHealthCardProps) {
  const healthLevel = facility.healthScore >= 80 ? 'good' : facility.healthScore >= 60 ? 'moderate' : 'poor';
  const colors = healthColors[healthLevel];
  const TrendIcon = trendIcons[facility.healthTrend].icon;
  const trendColor = trendIcons[facility.healthTrend].color;

  const suggestionsCount = facility.activeSuggestions?.length || 0;
  const hasUrgentSuggestions = facility.activeSuggestions?.some(s => s.priority === 'urgent');

  return (
    <Card
      className={cn(
        'transition-shadow hover:shadow-md',
        facility.maturity.actionRequired && 'border-amber-200 bg-amber-50/30'
      )}
      data-testid={`facility-health-card-${facility.facilityId}`}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Building className="h-4 w-4 text-zinc-400" />
              <span className="text-xs text-zinc-500">{facility.borrowerName}</span>
            </div>
            <CardTitle className="text-base font-semibold text-zinc-900">
              {facility.facilityName}
            </CardTitle>
          </div>
          <div className="flex items-center gap-1.5">
            <TrendIcon className={cn('h-4 w-4', trendColor)} />
            <span className={cn('text-xs font-medium capitalize', trendColor)}>
              {facility.healthTrend}
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Health Score */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-zinc-500">Health Score</span>
            <span className={cn('text-sm font-semibold', colors.text)}>
              {facility.healthScore}%
            </span>
          </div>
          <Progress
            value={facility.healthScore}
            className="h-2"
          />
        </div>

        {/* Market Exposure */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="text-center">
            <p className="text-[10px] text-zinc-500 mb-1">Rate Risk</p>
            <Badge variant="outline" className={cn('text-[10px]', exposureColors[facility.marketExposure.interestRateSensitivity])}>
              {facility.marketExposure.interestRateSensitivity}
            </Badge>
          </div>
          <div className="text-center">
            <p className="text-[10px] text-zinc-500 mb-1">Spread Exposure</p>
            <Badge variant="outline" className={cn('text-[10px]', exposureColors[facility.marketExposure.creditSpreadExposure])}>
              {facility.marketExposure.creditSpreadExposure}
            </Badge>
          </div>
          <div className="text-center">
            <p className="text-[10px] text-zinc-500 mb-1">Regulatory</p>
            <Badge variant="outline" className={cn('text-[10px]', exposureColors[facility.marketExposure.regulatoryRisk])}>
              {facility.marketExposure.regulatoryRisk}
            </Badge>
          </div>
        </div>

        {/* Maturity Alert */}
        {facility.maturity.actionRequired && (
          <div className="flex items-center gap-2 rounded-md bg-amber-50 border border-amber-200 p-2.5 mb-4">
            <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-amber-700">Maturity approaching</p>
              <p className="text-[10px] text-amber-600">
                {facility.maturity.daysUntil} days until {facility.maturity.date}
              </p>
            </div>
          </div>
        )}

        {/* Suggestions count */}
        {suggestionsCount > 0 && (
          <div className="flex items-center gap-2 rounded-md bg-blue-50 p-2.5 mb-4">
            <div className="flex-1">
              <p className="text-xs font-medium text-blue-700">
                {suggestionsCount} active suggestion{suggestionsCount !== 1 ? 's' : ''}
              </p>
              {hasUrgentSuggestions && (
                <p className="text-[10px] text-red-600 font-medium">
                  Includes urgent items
                </p>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-blue-600 h-7 text-xs"
              onClick={() => onViewSuggestions?.(facility.facilityId)}
              data-testid={`facility-view-suggestions-${facility.facilityId}`}
            >
              View
              <ChevronRight className="ml-1 h-3 w-3" />
            </Button>
          </div>
        )}

        {/* Recent changes */}
        {facility.recentChanges.length > 0 && (
          <div className="mb-3">
            <p className="text-xs font-medium text-zinc-700 mb-1.5">Recent Changes</p>
            <div className="space-y-1">
              {facility.recentChanges.slice(0, 2).map((change, idx) => (
                <div key={idx} className="flex items-start gap-2 text-xs">
                  <span
                    className={cn(
                      'mt-1.5 h-1.5 w-1.5 rounded-full shrink-0',
                      change.impact === 'positive' ? 'bg-green-500' :
                      change.impact === 'negative' ? 'bg-red-500' : 'bg-zinc-400'
                    )}
                  />
                  <span className="text-zinc-600 line-clamp-1">{change.description}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-zinc-100">
          <div className="flex items-center gap-1.5 text-xs text-zinc-500">
            <Calendar className="h-3 w-3" />
            <span>Matures {facility.maturity.date}</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-zinc-600 h-7 text-xs"
            onClick={() => onViewDetails?.(facility.facilityId)}
            data-testid={`facility-details-btn-${facility.facilityId}`}
          >
            Details
            <ArrowRight className="ml-1 h-3 w-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
