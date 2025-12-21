'use client';

import React, { memo, useState, useCallback } from 'react';
import Link from 'next/link';
import { Plus, Briefcase, GripVertical, Users, FileText, AlertCircle, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { DealWithStats } from '../lib/types';
import type { KanbanViewData } from '../lib/view-transformers';

interface DealKanbanViewProps {
  data: KanbanViewData;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: string) => void;
  isStatusPending?: (dealId: string) => boolean;
}

const statusColumns = [
  { key: 'draft', label: 'Draft', color: 'bg-zinc-500', bgColor: 'bg-zinc-50' },
  { key: 'active', label: 'Active', color: 'bg-green-500', bgColor: 'bg-green-50' },
  { key: 'paused', label: 'Paused', color: 'bg-amber-500', bgColor: 'bg-amber-50' },
  { key: 'agreed', label: 'Agreed', color: 'bg-blue-500', bgColor: 'bg-blue-50' },
  { key: 'closed', label: 'Closed', color: 'bg-purple-500', bgColor: 'bg-purple-50' },
] as const;

const dealTypeLabels: Record<string, string> = {
  new_facility: 'New Facility',
  amendment: 'Amendment',
  refinancing: 'Refinancing',
  extension: 'Extension',
  consent: 'Consent',
  waiver: 'Waiver',
};

interface KanbanCardProps {
  deal: DealWithStats;
  onDragStart: (e: React.DragEvent, dealId: string) => void;
}

const KanbanCard = memo(function KanbanCard({ deal, onDragStart }: KanbanCardProps) {
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const getProgressPercentage = () => {
    if (!deal.stats) return 0;
    const total = deal.stats.total_terms || 0;
    const agreed = deal.stats.agreed_terms || 0;
    return total > 0 ? Math.round((agreed / total) * 100) : 0;
  };

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, deal.id)}
      className="group cursor-grab active:cursor-grabbing"
      data-testid={`kanban-card-${deal.id}`}
    >
      <Card className="hover:shadow-md transition-all hover:border-blue-200 bg-white">
        <CardContent className="p-2.5">
          <div className="flex items-start gap-2">
            <GripVertical className="w-4 h-4 text-zinc-300 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <Link href={`/deals/${deal.id}`} data-testid={`kanban-card-${deal.id}-link`}>
                <h4 className="text-sm font-medium text-zinc-900 hover:text-blue-600 transition-colors truncate">
                  {deal.deal_name}
                </h4>
              </Link>

              <div className="flex items-center gap-1.5 mt-1.5">
                <Badge variant="outline" className="text-[10px] px-1.5 py-0" data-testid={`kanban-card-${deal.id}-type`}>
                  {dealTypeLabels[deal.deal_type] || deal.deal_type}
                </Badge>
              </div>

              {/* Stats Row */}
              <div className="flex items-center gap-3 mt-2 text-xs text-zinc-500">
                <div className="flex items-center gap-0.5">
                  <Users className="w-3 h-3" />
                  <span>{deal.stats?.participant_count || 0}</span>
                </div>
                <div className="flex items-center gap-0.5">
                  <FileText className="w-3 h-3" />
                  <span>{deal.stats?.total_terms || 0}</span>
                </div>
                {deal.stats?.pending_proposals && deal.stats.pending_proposals > 0 && (
                  <div className="flex items-center gap-0.5 text-amber-600">
                    <AlertCircle className="w-3 h-3" />
                    <span>{deal.stats.pending_proposals}</span>
                  </div>
                )}
              </div>

              {/* Progress Bar */}
              {(deal.stats?.total_terms || 0) > 0 && (
                <div className="mt-2">
                  <div className="h-1 bg-zinc-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500 rounded-full transition-all"
                      style={{ width: `${getProgressPercentage()}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-zinc-400 mt-0.5">{getProgressPercentage()}% agreed</span>
                </div>
              )}

              {/* Target Date */}
              {deal.target_close_date && (
                <div className="flex items-center gap-1 mt-2 text-[10px] text-zinc-400">
                  <Clock className="w-3 h-3" />
                  <span>Target: {formatDate(deal.target_close_date)}</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
});

interface KanbanColumnProps {
  column: typeof statusColumns[number];
  deals: DealWithStats[];
  onDragStart: (e: React.DragEvent, dealId: string) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, status: string) => void;
  isDragOver: boolean;
}

const KanbanColumn = memo(function KanbanColumn({
  column,
  deals,
  onDragStart,
  onDragOver,
  onDrop,
  isDragOver,
}: KanbanColumnProps) {
  return (
    <div
      className={`flex flex-col min-w-[280px] max-w-[320px] rounded-lg ${column.bgColor} transition-all ${
        isDragOver ? 'ring-2 ring-blue-400 ring-offset-2' : ''
      }`}
      onDragOver={onDragOver}
      onDrop={(e) => onDrop(e, column.key)}
      data-testid={`kanban-column-${column.key}`}
    >
      <div className="p-2.5 border-b border-zinc-200/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${column.color}`} />
            <h3 className="font-medium text-sm text-zinc-700">{column.label}</h3>
          </div>
          <Badge variant="secondary" className="text-xs" data-testid={`kanban-column-${column.key}-count`}>
            {deals.length}
          </Badge>
        </div>
      </div>

      <div className="flex-1 p-1.5 space-y-1.5 overflow-y-auto max-h-[calc(100vh-350px)]" data-testid={`kanban-column-${column.key}-cards`}>
        {deals.map((deal) => (
          <KanbanCard key={deal.id} deal={deal} onDragStart={onDragStart} />
        ))}
        {deals.length === 0 && (
          <div className="text-center py-8 text-zinc-400 text-sm">
            No deals
          </div>
        )}
      </div>
    </div>
  );
});

export const DealKanbanView = memo(function DealKanbanView({
  data,
  onDelete,
  onStatusChange,
  isStatusPending,
}: DealKanbanViewProps) {
  const [draggedDealId, setDraggedDealId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);

  // Data is already transformed by the view transformer
  const dealsByStatus = data;

  const handleDragStart = useCallback((e: React.DragEvent, dealId: string) => {
    setDraggedDealId(dealId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', dealId);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const handleDragEnter = useCallback((columnKey: string) => {
    setDragOverColumn(columnKey);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOverColumn(null);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, newStatus: string) => {
    e.preventDefault();
    const dealId = e.dataTransfer.getData('text/plain');

    if (dealId && draggedDealId) {
      // Find deal in any column
      const allDeals = Object.values(dealsByStatus).flat();
      const deal = allDeals.find((d) => d.id === dealId);
      if (deal && deal.status !== newStatus) {
        onStatusChange(dealId, newStatus);
      }
    }

    setDraggedDealId(null);
    setDragOverColumn(null);
  }, [draggedDealId, dealsByStatus, onStatusChange]);

  // Check if all columns are empty
  const totalDeals = Object.values(dealsByStatus).reduce((sum, deals) => sum + deals.length, 0);

  if (totalDeals === 0) {
    return (
      <Card className="py-12 animate-in fade-in duration-500 delay-300">
        <CardContent className="text-center">
          <Briefcase className="w-12 h-12 mx-auto text-zinc-300 mb-4" />
          <p className="text-zinc-500">No deals found matching your filters.</p>
          <Link href="/deals/new" data-testid="kanban-create-new-link">
            <Button className="mt-4 transition-transform hover:scale-105" data-testid="kanban-create-new-btn">
              <Plus className="w-4 h-4 mr-2" />
              Create New Deal
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <div
      className="flex gap-3 overflow-x-auto pb-3 animate-in fade-in duration-500 delay-300"
      data-testid="deal-kanban-view"
    >
      {statusColumns.map((column) => (
        <div
          key={column.key}
          onDragEnter={() => handleDragEnter(column.key)}
          onDragLeave={handleDragLeave}
        >
          <KanbanColumn
            column={column}
            deals={dealsByStatus[column.key] || []}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            isDragOver={dragOverColumn === column.key}
          />
        </div>
      ))}
    </div>
  );
});
