'use client';

import { useState, useEffect, useCallback } from 'react';
import type { TradingDashboardStats } from './types';
import {
  createDashboardStats,
  createSettlementList,
  createActivityList,
  createTradeList,
  resetIdCounter,
} from './fixtures';

// Generate deterministic fallback data for development/fallback scenarios
resetIdCounter(1000);
const fallbackStats = createDashboardStats({
  total_facilities: 8,
  total_positions: 15,
  total_position_value: 125000000,
  active_trades: 4,
  trades_in_dd: 2,
  trades_pending_settlement: 1,
  settled_this_month: 3,
  settled_volume_this_month: 45000000,
  dd_completion_rate: 68,
  average_settlement_days: 10,
  flagged_items_count: 3,
  open_questions_count: 5,
});
const fallbackSettlements = createSettlementList(3);
const fallbackActivity = createActivityList(4);
const fallbackTrades = createTradeList(3, { status: 'in_due_diligence' });

interface UseTradingDashboardResult {
  data: TradingDashboardStats | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook to fetch unified trading dashboard data from a single API endpoint.
 * Returns stats, trades_in_progress, upcoming_settlements, and recent_activity
 * in a single response to eliminate multiple round trips.
 */
export function useTradingDashboard(): UseTradingDashboardResult {
  const [data, setData] = useState<TradingDashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/trading/dashboard');
      const result = await response.json();

      if (result.success && result.data) {
        setData(result.data);
      } else {
        // Use fallback data with mock values for development/unauthenticated state
        setData({
          ...fallbackStats,
          trades_in_progress: fallbackTrades,
          upcoming_settlements: fallbackSettlements,
          recent_activity: fallbackActivity,
        });
        if (result.error?.code !== 'UNAUTHORIZED') {
          setError(result.error?.message || 'Failed to fetch dashboard data');
        }
      }
    } catch (err) {
      // Use fallback data on network errors
      setData({
        ...fallbackStats,
        trades_in_progress: fallbackTrades,
        upcoming_settlements: fallbackSettlements,
        recent_activity: fallbackActivity,
      });
      setError('Network error fetching dashboard data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  return { data, isLoading, error, refetch: fetchDashboard };
}
