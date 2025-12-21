'use client';

import React, { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Target, CheckCircle, AlertTriangle, TrendingDown, Clock, Info } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { InstitutionalESGTarget, TargetStatus } from '../lib';

interface InstitutionalTargetsCardProps {
  data: InstitutionalESGTarget[];
  title?: string;
  description?: string;
}

function getStatusIcon(status: TargetStatus) {
  switch (status) {
    case 'achieved':
      return <CheckCircle className="w-4 h-4 text-green-600" />;
    case 'on_track':
      return <CheckCircle className="w-4 h-4 text-green-600" />;
    case 'at_risk':
      return <AlertTriangle className="w-4 h-4 text-amber-600" />;
    case 'off_track':
    case 'missed':
      return <TrendingDown className="w-4 h-4 text-red-600" />;
    default:
      return <Clock className="w-4 h-4 text-zinc-400" />;
  }
}

function getStatusBadgeVariant(status: TargetStatus): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'achieved':
    case 'on_track':
      return 'default';
    case 'at_risk':
      return 'secondary';
    case 'off_track':
    case 'missed':
      return 'destructive';
    default:
      return 'outline';
  }
}

function getStatusLabel(status: TargetStatus): string {
  switch (status) {
    case 'achieved':
      return 'Achieved';
    case 'on_track':
      return 'On Track';
    case 'at_risk':
      return 'At Risk';
    case 'off_track':
      return 'Off Track';
    case 'missed':
      return 'Missed';
    default:
      return 'Pending';
  }
}

function getProgressColor(status: TargetStatus): string {
  switch (status) {
    case 'achieved':
    case 'on_track':
      return 'bg-green-500';
    case 'at_risk':
      return 'bg-amber-500';
    case 'off_track':
    case 'missed':
      return 'bg-red-500';
    default:
      return 'bg-zinc-400';
  }
}

function getCategoryLabel(category: string): string {
  switch (category) {
    case 'emissions':
      return 'Emissions';
    case 'renewable':
      return 'Renewable';
    case 'diversity':
      return 'Diversity';
    case 'allocation':
      return 'Allocation';
    case 'rating':
      return 'Rating';
    default:
      return category;
  }
}

function formatTargetDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric',
  });
}

export const InstitutionalTargetsCard = memo(function InstitutionalTargetsCard({
  data,
  title = 'Institutional ESG Targets',
  description = 'Progress toward organizational sustainability goals',
}: InstitutionalTargetsCardProps) {
  const onTrackCount = data.filter(t => t.status === 'on_track' || t.status === 'achieved').length;
  const atRiskCount = data.filter(t => t.status === 'at_risk').length;
  const offTrackCount = data.filter(t => t.status === 'off_track' || t.status === 'missed').length;

  return (
    <TooltipProvider>
      <Card className="animate-in fade-in slide-in-from-bottom-4 duration-500" data-testid="institutional-targets-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-blue-600" />
              <div>
                <CardTitle>{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {onTrackCount > 0 && (
                <Badge variant="default" className="bg-green-100 text-green-700">
                  {onTrackCount} On Track
                </Badge>
              )}
              {atRiskCount > 0 && (
                <Badge variant="secondary">
                  {atRiskCount} At Risk
                </Badge>
              )}
              {offTrackCount > 0 && (
                <Badge variant="destructive">
                  {offTrackCount} Off Track
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.map((target) => (
              <div
                key={target.id}
                className="p-3 rounded-lg bg-zinc-50 hover:bg-zinc-100 transition-colors"
                data-testid={`target-item-${target.id}`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-start gap-3">
                    {getStatusIcon(target.status)}
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-zinc-900">{target.name}</h4>
                        <Badge variant="outline" className="text-xs">
                          {getCategoryLabel(target.category)}
                        </Badge>
                      </div>
                      <p className="text-sm text-zinc-500 mt-0.5">{target.description}</p>
                    </div>
                  </div>
                  <Badge variant={getStatusBadgeVariant(target.status)}>
                    {getStatusLabel(target.status)}
                  </Badge>
                </div>

                {/* Progress Section */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-zinc-500">Progress</span>
                    <span className="font-medium text-zinc-900">
                      {target.current_value}{target.unit} / {target.target_value}{target.unit}
                    </span>
                  </div>

                  <div className="relative">
                    <Progress value={target.progress_percentage} className="h-2 bg-zinc-200" />
                    <div
                      className={`absolute top-0 h-2 rounded-full transition-all ${getProgressColor(target.status)}`}
                      style={{ width: `${Math.min(target.progress_percentage, 100)}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs text-zinc-500">
                    <span>{target.progress_percentage.toFixed(1)}% complete</span>
                    <span>Due: {formatTargetDate(target.target_date)}</span>
                  </div>
                </div>

                {/* Gap Analysis */}
                {target.gap_analysis && (
                  <div className="mt-2 pt-2 border-t border-zinc-200">
                    <div className="flex items-start gap-2">
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Gap analysis and recommendations</p>
                        </TooltipContent>
                      </Tooltip>
                      <p className="text-xs text-zinc-600">{target.gap_analysis}</p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
});
