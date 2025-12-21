'use client';

import React, { memo } from 'react';
import Link from 'next/link';
import { Plus, Briefcase, Users, Clock, MoreHorizontal, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { DealCard } from '@/components/deals';
import { SortableColumnHeader } from './SortableColumnHeader';
import {
  getStatusColor,
  getStatusLabel,
  getStatusBadgeVariant,
} from '@/lib/utils/statusHelpers';
import { getAnimationDelayStyle } from '@/lib/utils/animation';
import { formatDate } from '@/lib/utils/formatters';
import type { DealWithStats } from '../lib/types';
import type { DealSortState, DealSortField } from '../lib/sort-types';

export type DealListViewLayout = 'grid' | 'table';

interface DealListViewProps {
  deals: DealWithStats[];
  layout: DealListViewLayout;
  sortState?: DealSortState;
  onSort?: (field: DealSortField, isShiftHeld: boolean) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: string) => void;
  isStatusPending?: (dealId: string) => boolean;
}

const dealTypeLabels: Record<string, string> = {
  new_facility: 'New Facility',
  amendment: 'Amendment',
  refinancing: 'Refinancing',
  extension: 'Extension',
  consent: 'Consent',
  waiver: 'Waiver',
};

function getProgressPercentage(deal: DealWithStats): number {
  if (!deal.stats) return 0;
  const total = deal.stats.total_terms || 0;
  const agreed = deal.stats.agreed_terms || 0;
  return total > 0 ? Math.round((agreed / total) * 100) : 0;
}

function EmptyState() {
  return (
    <Card className="py-12 animate-in fade-in duration-500 delay-300" data-testid="deal-list-empty">
      <CardContent className="text-center">
        <Briefcase className="w-12 h-12 mx-auto text-zinc-300 mb-4" />
        <p className="text-zinc-500">No deals found matching your filters.</p>
        <Link href="/deals/new" data-testid="deal-list-empty-create-link">
          <Button className="mt-4 transition-transform hover:scale-105" data-testid="deal-list-empty-create-btn">
            <Plus className="w-4 h-4 mr-2" />
            Create New Deal
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}

interface GridViewProps {
  deals: DealWithStats[];
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: string) => void;
  isStatusPending?: (dealId: string) => boolean;
}

function GridView({ deals, onDelete, onStatusChange, isStatusPending }: GridViewProps) {
  return (
    <div
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 animate-in fade-in duration-500 delay-300"
      data-testid="deal-list-grid"
    >
      {deals.map((deal, index) => (
        <div
          key={deal.id}
          className="animate-in slide-in-from-bottom-4 fade-in duration-500"
          style={{ animationDelay: `${300 + index * 50}ms` }}
          data-testid={`deal-list-item-${deal.id}`}
        >
          <DealCard
            deal={deal}
            onDelete={onDelete}
            onStatusChange={onStatusChange}
            isStatusPending={isStatusPending?.(deal.id)}
          />
        </div>
      ))}
    </div>
  );
}

interface TableViewProps {
  deals: DealWithStats[];
  sortState?: DealSortState;
  onSort?: (field: DealSortField, isShiftHeld: boolean) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: string) => void;
  isStatusPending?: (dealId: string) => boolean;
}

function TableView({ deals, sortState, onSort, onDelete, onStatusChange, isStatusPending }: TableViewProps) {
  return (
    <Card className="animate-in fade-in duration-500 delay-300 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full" data-testid="deal-list-table">
          <thead>
            <tr className="border-b border-zinc-100 bg-zinc-50/50">
              <th className="text-left py-2 px-3">
                {sortState && onSort ? (
                  <SortableColumnHeader
                    field="deal_name"
                    label="Name"
                    sortState={sortState}
                    onSort={onSort}
                  />
                ) : (
                  <span className="text-xs font-medium text-zinc-600">Name</span>
                )}
              </th>
              <th className="text-left py-2 px-3">
                {sortState && onSort ? (
                  <SortableColumnHeader
                    field="status"
                    label="Status"
                    sortState={sortState}
                    onSort={onSort}
                  />
                ) : (
                  <span className="text-xs font-medium text-zinc-600">Status</span>
                )}
              </th>
              <th className="text-left py-2 px-3">
                {sortState && onSort ? (
                  <SortableColumnHeader
                    field="progress"
                    label="Progress"
                    sortState={sortState}
                    onSort={onSort}
                  />
                ) : (
                  <span className="text-xs font-medium text-zinc-600">Progress</span>
                )}
              </th>
              <th className="text-left py-2 px-3">
                {sortState && onSort ? (
                  <SortableColumnHeader
                    field="target_close_date"
                    label="Target"
                    sortState={sortState}
                    onSort={onSort}
                  />
                ) : (
                  <span className="text-xs font-medium text-zinc-600">Target</span>
                )}
              </th>
              <th className="text-left py-2 px-3">
                {sortState && onSort ? (
                  <SortableColumnHeader
                    field="created_at"
                    label="Created"
                    sortState={sortState}
                    onSort={onSort}
                  />
                ) : (
                  <span className="text-xs font-medium text-zinc-600">Created</span>
                )}
              </th>
              <th className="text-left py-2 px-3">
                {sortState && onSort ? (
                  <SortableColumnHeader
                    field="participant_count"
                    label="People"
                    sortState={sortState}
                    onSort={onSort}
                  />
                ) : (
                  <span className="text-xs font-medium text-zinc-600">People</span>
                )}
              </th>
              <th className="w-10 py-2 px-3">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {deals.map((deal, index) => {
              const progress = getProgressPercentage(deal);
              const isPending = isStatusPending?.(deal.id) ?? false;

              return (
                <tr
                  key={deal.id}
                  className="border-b border-zinc-100 last:border-b-0 hover:bg-zinc-50/50 transition-colors animate-in slide-in-from-bottom-2 fade-in duration-300"
                  style={getAnimationDelayStyle(index, 'fast')}
                  data-testid={`deal-list-row-${deal.id}`}
                >
                  <td className="py-2.5 px-3">
                    <div>
                      <Link
                        href={`/deals/${deal.id}`}
                        className="font-medium text-sm text-zinc-900 hover:text-blue-600 transition-colors"
                        data-testid={`deal-list-link-${deal.id}`}
                      >
                        {deal.deal_name}
                      </Link>
                      <div className="text-[10px] text-zinc-500">
                        {dealTypeLabels[deal.deal_type] || deal.deal_type}
                      </div>
                    </div>
                  </td>
                  <td className="py-2.5 px-3">
                    <Badge
                      variant={getStatusBadgeVariant(deal.status)}
                      className={`text-[10px] px-1.5 py-0 ${getStatusColor(deal.status)} ${isPending ? 'opacity-70' : ''}`}
                      data-testid={`deal-list-status-${deal.id}`}
                    >
                      {isPending && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}
                      {getStatusLabel(deal.status)}
                    </Badge>
                  </td>
                  <td className="py-2.5 px-3">
                    <div className="flex items-center gap-2 min-w-[100px]">
                      <Progress value={progress} className="flex-1 h-1.5 w-16" />
                      <span className="text-xs text-zinc-500 w-7 text-right">{progress}%</span>
                    </div>
                  </td>
                  <td className="py-2.5 px-3">
                    <div className="flex items-center gap-1 text-xs text-zinc-600">
                      {deal.target_close_date && <Clock className="w-3 h-3 text-zinc-400" />}
                      <span>{formatDate(deal.target_close_date)}</span>
                    </div>
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="text-xs text-zinc-600">
                      {formatDate(deal.created_at)}
                    </span>
                  </td>
                  <td className="py-2.5 px-3">
                    <div className="flex items-center gap-1 text-xs text-zinc-600">
                      <Users className="w-3 h-3 text-zinc-400" />
                      <span>{deal.stats?.participant_count || 0}</span>
                    </div>
                  </td>
                  <td className="py-2.5 px-3">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          data-testid={`deal-list-actions-${deal.id}`}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" data-testid={`deal-list-menu-${deal.id}`}>
                        <DropdownMenuItem asChild data-testid={`deal-list-view-${deal.id}`}>
                          <Link href={`/deals/${deal.id}`}>View Deal</Link>
                        </DropdownMenuItem>
                        {deal.status === 'draft' && (
                          <DropdownMenuItem
                            onClick={() => onStatusChange(deal.id, 'active')}
                            disabled={isPending}
                            data-testid={`deal-list-activate-${deal.id}`}
                          >
                            {isPending && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}
                            Activate Deal
                          </DropdownMenuItem>
                        )}
                        {deal.status === 'active' && (
                          <>
                            <DropdownMenuItem
                              onClick={() => onStatusChange(deal.id, 'paused')}
                              disabled={isPending}
                              data-testid={`deal-list-pause-${deal.id}`}
                            >
                              {isPending && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}
                              Pause Deal
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => onStatusChange(deal.id, 'agreed')}
                              disabled={isPending}
                              data-testid={`deal-list-agree-${deal.id}`}
                            >
                              {isPending && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}
                              Mark as Agreed
                            </DropdownMenuItem>
                          </>
                        )}
                        {deal.status === 'paused' && (
                          <DropdownMenuItem
                            onClick={() => onStatusChange(deal.id, 'active')}
                            disabled={isPending}
                            data-testid={`deal-list-resume-${deal.id}`}
                          >
                            {isPending && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}
                            Resume Deal
                          </DropdownMenuItem>
                        )}
                        {deal.status === 'draft' && (
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => onDelete(deal.id)}
                            data-testid={`deal-list-delete-${deal.id}`}
                          >
                            Delete Draft
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

export const DealListView = memo(function DealListView({
  deals,
  layout,
  sortState,
  onSort,
  onDelete,
  onStatusChange,
  isStatusPending,
}: DealListViewProps) {
  if (deals.length === 0) {
    return <EmptyState />;
  }

  if (layout === 'grid') {
    return (
      <GridView
        deals={deals}
        onDelete={onDelete}
        onStatusChange={onStatusChange}
        isStatusPending={isStatusPending}
      />
    );
  }

  return (
    <TableView
      deals={deals}
      sortState={sortState}
      onSort={onSort}
      onDelete={onDelete}
      onStatusChange={onStatusChange}
      isStatusPending={isStatusPending}
    />
  );
});
