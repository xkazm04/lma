'use client';

import React, { memo, useMemo } from 'react';
import Link from 'next/link';
import { Plus, Briefcase, Calendar, Users, FileText, AlertCircle, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { DealWithStats } from '../lib/types';
import type { TimelineViewData } from '../lib/view-transformers';

interface DealTimelineViewProps {
  data: TimelineViewData;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: string) => void;
  isStatusPending?: (dealId: string) => boolean;
}

const statusConfig = {
  draft: { label: 'Draft', color: 'bg-zinc-400', borderColor: 'border-zinc-400', textColor: 'text-zinc-700' },
  active: { label: 'Active', color: 'bg-green-500', borderColor: 'border-green-500', textColor: 'text-green-700' },
  paused: { label: 'Paused', color: 'bg-amber-500', borderColor: 'border-amber-500', textColor: 'text-amber-700' },
  agreed: { label: 'Agreed', color: 'bg-blue-500', borderColor: 'border-blue-500', textColor: 'text-blue-700' },
  closed: { label: 'Closed', color: 'bg-purple-500', borderColor: 'border-purple-500', textColor: 'text-purple-700' },
  terminated: { label: 'Terminated', color: 'bg-red-500', borderColor: 'border-red-500', textColor: 'text-red-700' },
};

const dealTypeLabels: Record<string, string> = {
  new_facility: 'New Facility',
  amendment: 'Amendment',
  refinancing: 'Refinancing',
  extension: 'Extension',
  consent: 'Consent',
  waiver: 'Waiver',
};

interface TimelineDealCardProps {
  deal: DealWithStats;
  style: React.CSSProperties;
}

const TimelineDealCard = memo(function TimelineDealCard({ deal, style }: TimelineDealCardProps) {
  const status = statusConfig[deal.status as keyof typeof statusConfig] || statusConfig.draft;

  const getProgressPercentage = () => {
    if (!deal.stats) return 0;
    const total = deal.stats.total_terms || 0;
    const agreed = deal.stats.agreed_terms || 0;
    return total > 0 ? Math.round((agreed / total) * 100) : 0;
  };

  return (
    <div
      className={`absolute rounded-md border-l-4 ${status.borderColor} bg-white shadow-sm hover:shadow-md transition-shadow cursor-pointer overflow-hidden`}
      style={style}
      data-testid={`timeline-card-${deal.id}`}
    >
      <Link href={`/deals/${deal.id}`} className="block p-2" data-testid={`timeline-card-${deal.id}-link`}>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h4 className="text-xs font-medium text-zinc-900 truncate">{deal.deal_name}</h4>
            <div className="flex items-center gap-1.5 mt-1">
              <Badge variant="outline" className={`text-[9px] px-1 py-0 ${status.textColor}`}>
                {status.label}
              </Badge>
              <Badge variant="outline" className="text-[9px] px-1 py-0">
                {dealTypeLabels[deal.deal_type] || deal.deal_type}
              </Badge>
            </div>
          </div>
        </div>

        {/* Mini stats */}
        <div className="flex items-center gap-2 mt-1.5 text-[10px] text-zinc-500">
          <div className="flex items-center gap-0.5">
            <Users className="w-2.5 h-2.5" />
            <span>{deal.stats?.participant_count || 0}</span>
          </div>
          <div className="flex items-center gap-0.5">
            <FileText className="w-2.5 h-2.5" />
            <span>{deal.stats?.total_terms || 0}</span>
          </div>
          {deal.stats?.pending_proposals && deal.stats.pending_proposals > 0 && (
            <div className="flex items-center gap-0.5 text-amber-600">
              <AlertCircle className="w-2.5 h-2.5" />
              <span>{deal.stats.pending_proposals}</span>
            </div>
          )}
        </div>

        {/* Progress Bar */}
        {(deal.stats?.total_terms || 0) > 0 && (
          <div className="mt-1.5">
            <div className="h-1 bg-zinc-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 rounded-full"
                style={{ width: `${getProgressPercentage()}%` }}
              />
            </div>
          </div>
        )}
      </Link>
    </div>
  );
});

export const DealTimelineView = memo(function DealTimelineView({
  data,
}: DealTimelineViewProps) {
  const [viewOffset, setViewOffset] = React.useState(0);

  // Data is already transformed by the view transformer
  const { dealsWithDates, dealsWithoutDates } = data;

  // Calculate timeline range
  const { timelineStart, timelineEnd, weeks } = useMemo(() => {
    const now = new Date();
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - 14 + viewOffset * 28); // 2 weeks before
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 84); // 12 weeks total

    // Generate weeks
    const weeksList: Date[] = [];
    const current = new Date(startDate);
    while (current <= endDate) {
      weeksList.push(new Date(current));
      current.setDate(current.getDate() + 7);
    }

    return {
      timelineStart: startDate,
      timelineEnd: endDate,
      weeks: weeksList,
    };
  }, [viewOffset]);

  const formatWeek = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatMonthYear = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  // Calculate position for a deal based on target_close_date
  const getCardPosition = (deal: DealWithStats, index: number) => {
    if (!deal.target_close_date) return null;

    const targetDate = new Date(deal.target_close_date);
    const totalDays = (timelineEnd.getTime() - timelineStart.getTime()) / (1000 * 60 * 60 * 24);
    const daysFromStart = (targetDate.getTime() - timelineStart.getTime()) / (1000 * 60 * 60 * 24);
    const leftPercent = (daysFromStart / totalDays) * 100;

    // Stack cards vertically if they overlap
    const row = index % 4;

    return {
      left: `${Math.max(0, Math.min(95, leftPercent))}%`,
      top: `${row * 95 + 20}px`,
      width: '200px',
    };
  };

  // Check if today is within the visible range
  const todayPosition = useMemo(() => {
    const now = new Date();
    const totalDays = (timelineEnd.getTime() - timelineStart.getTime()) / (1000 * 60 * 60 * 24);
    const daysFromStart = (now.getTime() - timelineStart.getTime()) / (1000 * 60 * 60 * 24);
    const leftPercent = (daysFromStart / totalDays) * 100;
    return leftPercent >= 0 && leftPercent <= 100 ? leftPercent : null;
  }, [timelineStart, timelineEnd]);

  const totalDeals = dealsWithDates.length + dealsWithoutDates.length;

  if (totalDeals === 0) {
    return (
      <Card className="py-12 animate-in fade-in duration-500 delay-300">
        <CardContent className="text-center">
          <Briefcase className="w-12 h-12 mx-auto text-zinc-300 mb-4" />
          <p className="text-zinc-500">No deals found matching your filters.</p>
          <Link href="/deals/new" data-testid="timeline-create-new-link">
            <Button className="mt-4 transition-transform hover:scale-105" data-testid="timeline-create-new-btn">
              <Plus className="w-4 h-4 mr-2" />
              Create New Deal
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4 animate-in fade-in duration-500 delay-300" data-testid="deal-timeline-view">
      {/* Timeline Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-zinc-500" />
          <span className="font-medium text-zinc-700">
            {formatMonthYear(timelineStart)} - {formatMonthYear(timelineEnd)}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setViewOffset((prev) => prev - 1)}
            data-testid="timeline-prev-btn"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setViewOffset(0)}
            data-testid="timeline-today-btn"
          >
            Today
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setViewOffset((prev) => prev + 1)}
            data-testid="timeline-next-btn"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Timeline Header */}
      <Card>
        <CardContent className="p-0">
          {/* Week headers */}
          <div className="flex border-b border-zinc-200 bg-zinc-50">
            {weeks.map((week, idx) => (
              <div
                key={idx}
                className="flex-1 text-center py-2 text-xs font-medium text-zinc-600 border-r border-zinc-200 last:border-r-0"
              >
                {formatWeek(week)}
              </div>
            ))}
          </div>

          {/* Timeline body */}
          <div className="relative" style={{ minHeight: '420px' }}>
            {/* Grid lines */}
            <div className="absolute inset-0 flex">
              {weeks.map((_, idx) => (
                <div
                  key={idx}
                  className="flex-1 border-r border-zinc-100 last:border-r-0"
                />
              ))}
            </div>

            {/* Today marker */}
            {todayPosition !== null && (
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10"
                style={{ left: `${todayPosition}%` }}
                data-testid="timeline-today-marker"
              >
                <div className="absolute -top-0 left-1/2 -translate-x-1/2 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded">
                  Today
                </div>
              </div>
            )}

            {/* Deal cards */}
            {dealsWithDates.map((deal, index) => {
              const position = getCardPosition(deal, index);
              if (!position) return null;

              return (
                <TimelineDealCard
                  key={deal.id}
                  deal={deal}
                  style={position}
                />
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Deals without target dates */}
      {dealsWithoutDates.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-4 h-4 text-zinc-400" />
              <span className="text-sm font-medium text-zinc-600">
                Deals without target close date ({dealsWithoutDates.length})
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {dealsWithoutDates.map((deal) => {
                const status = statusConfig[deal.status as keyof typeof statusConfig] || statusConfig.draft;
                return (
                  <Link key={deal.id} href={`/deals/${deal.id}`} data-testid={`timeline-nodate-card-${deal.id}`}>
                    <Badge
                      variant="outline"
                      className={`${status.borderColor} ${status.textColor} cursor-pointer hover:bg-zinc-50`}
                    >
                      {deal.deal_name}
                    </Badge>
                  </Link>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 text-xs text-zinc-500">
        {Object.entries(statusConfig).slice(0, 5).map(([key, config]) => (
          <div key={key} className="flex items-center gap-1">
            <div className={`w-2 h-2 rounded-full ${config.color}`} />
            <span>{config.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
});
