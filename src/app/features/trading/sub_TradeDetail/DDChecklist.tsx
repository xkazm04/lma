'use client';

import React, { useState, useCallback } from 'react';
import { ChevronDown, ChevronRight, AlertTriangle, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getDDItemStatusIcon } from '../lib/utils';
import { formatDate } from '@/lib/utils/formatters';
import type { DDChecklist as DDChecklistType, DDChecklistItem } from '../lib/types';

interface DDChecklistProps {
  checklist: DDChecklistType;
  tradeId: string;
  onItemVerified?: (itemId: string, result: VerifyResult) => void;
}

interface VerifyResult {
  item_id: string;
  item_status: string;
  timeline_event_id: string;
  actor_name: string;
  verified_at: string;
}

export const DDChecklist = React.memo<DDChecklistProps>(({ checklist, tradeId, onItemVerified }) => {
  const [expandedCategories, setExpandedCategories] = useState<string[]>([
    'facility_status',
    'borrower_creditworthiness',
    'covenant_compliance',
    'transferability',
  ]);
  const [verifyingItems, setVerifyingItems] = useState<Set<string>>(new Set());
  const [localItems, setLocalItems] = useState<Record<string, DDChecklistItem>>({});
  const [error, setError] = useState<string | null>(null);

  const toggleCategory = (key: string) => {
    setExpandedCategories((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const handleVerifyItem = useCallback(async (itemId: string) => {
    setVerifyingItems((prev) => new Set(prev).add(itemId));
    setError(null);

    try {
      const response = await fetch(`/api/trading/trades/${tradeId}/checklist/items/${itemId}/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error?.message || 'Failed to verify item');
      }

      // Update local state to reflect the verified item
      setLocalItems((prev) => ({
        ...prev,
        [itemId]: {
          ...prev[itemId],
          id: itemId,
          item_name: data.data.item_name || '',
          status: 'verified',
          verified_at: data.data.verified_at,
        },
      }));

      // Notify parent component
      if (onItemVerified) {
        onItemVerified(itemId, {
          item_id: itemId,
          item_status: 'verified',
          timeline_event_id: data.data.timeline_event_id,
          actor_name: data.data.actor_name,
          verified_at: data.data.verified_at,
        });
      }
    } catch (err) {
      console.error('Error verifying item:', err);
      setError(err instanceof Error ? err.message : 'Failed to verify item');
    } finally {
      setVerifyingItems((prev) => {
        const next = new Set(prev);
        next.delete(itemId);
        return next;
      });
    }
  }, [tradeId, onItemVerified]);

  // Merge local state with checklist items
  const getItemState = (item: DDChecklistItem): DDChecklistItem => {
    return localItems[item.id] ? { ...item, ...localItems[item.id] } : item;
  };

  // Calculate current completion based on local updates
  const completedItems = checklist.categories.reduce((count, category) => {
    return count + category.items.filter((item) => {
      const state = getItemState(item);
      return state.status === 'verified' || state.status === 'waived';
    }).length;
  }, 0);

  return (
    <Card className="animate-in fade-in slide-in-from-left-4 duration-500">
      <CardHeader>
        <CardTitle>Due Diligence Checklist</CardTitle>
        <CardDescription>
          {completedItems} of {checklist.total_items} items completed
        </CardDescription>
        {error && (
          <p className="text-sm text-red-600 mt-2" data-testid="dd-checklist-error">{error}</p>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {checklist.categories.map((category) => (
            <div key={category.key} className="border border-zinc-200 rounded-lg overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300">
              <button
                onClick={() => toggleCategory(category.key)}
                className="w-full flex items-center justify-between p-3 hover:bg-zinc-50 transition-colors"
                data-testid={`dd-category-toggle-${category.key}`}
              >
                <div className="flex items-center gap-2">
                  {expandedCategories.includes(category.key) ? (
                    <ChevronDown className="w-4 h-4 text-zinc-400" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-zinc-400" />
                  )}
                  <span className="font-medium text-sm text-zinc-900">{category.name}</span>
                  <Badge variant="outline" className="text-xs">
                    {category.items.filter((i) => getItemState(i).status === 'verified').length}/{category.items.length}
                  </Badge>
                </div>
                {category.items.some((i) => getItemState(i).status === 'flagged') && (
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                )}
              </button>

              {expandedCategories.includes(category.key) && (
                <div className="border-t border-zinc-200 divide-y divide-zinc-100">
                  {category.items.map((originalItem) => {
                    const item = getItemState(originalItem);
                    const isVerifying = verifyingItems.has(item.id);

                    return (
                      <div
                        key={item.id}
                        className="flex items-center gap-2 py-2.5 px-3 pl-8 hover:bg-zinc-50 transition-colors"
                        data-testid={`dd-item-${item.id}`}
                      >
                        {isVerifying ? (
                          <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                        ) : (
                          getDDItemStatusIcon(item.status)
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-zinc-900">{item.item_name}</p>
                          {item.status === 'verified' && item.verified_at && (
                            <p className="text-xs text-zinc-500">{formatDate(item.verified_at, 'MMM d, h:mm a')}</p>
                          )}
                          {item.status === 'flagged' && item.flag_reason && (
                            <p className="text-xs text-red-600 mt-0.5 truncate">{item.flag_reason}</p>
                          )}
                        </div>
                        {item.status === 'pending' && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs hover:bg-green-50 hover:border-green-300 transition-colors"
                            onClick={() => handleVerifyItem(item.id)}
                            disabled={isVerifying}
                            data-testid={`dd-verify-btn-${item.id}`}
                          >
                            {isVerifying ? (
                              <>
                                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                Verifying
                              </>
                            ) : (
                              'Verify'
                            )}
                          </Button>
                        )}
                        {item.status === 'flagged' && (
                          <Badge variant={item.flag_severity === 'blocker' ? 'destructive' : 'warning'} className="text-xs">
                            {item.flag_severity}
                          </Badge>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
});

DDChecklist.displayName = 'DDChecklist';
