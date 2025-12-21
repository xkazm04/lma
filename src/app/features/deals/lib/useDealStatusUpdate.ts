import { useCallback, useRef, useState } from 'react';
import type { Deal, DealWithStats } from './types';

type DealStatus = Deal['status'];

interface PendingRequest {
  abortController: AbortController;
  requestId: number;
  previousStatus: DealStatus;
}

interface StatusUpdateState {
  pendingDeals: Map<string, PendingRequest>;
  optimisticStatuses: Map<string, DealStatus>;
}

interface UseDealStatusUpdateOptions {
  /**
   * Callback to update the deals list with the new status
   */
  onDealsUpdate: (updater: (deals: DealWithStats[]) => DealWithStats[]) => void;
  /**
   * Optional callback for error handling
   */
  onError?: (dealId: string, error: Error, previousStatus: DealStatus) => void;
  /**
   * Optional callback for successful status change
   */
  onSuccess?: (dealId: string, newStatus: DealStatus) => void;
}

interface UseDealStatusUpdateReturn {
  /**
   * Update a deal's status with optimistic UI and request cancellation
   */
  updateStatus: (dealId: string, newStatus: DealStatus, currentStatus: DealStatus) => Promise<void>;
  /**
   * Check if a deal has a pending status update
   */
  isPending: (dealId: string) => boolean;
  /**
   * Get the optimistic status for a deal (if any)
   */
  getOptimisticStatus: (dealId: string) => DealStatus | undefined;
  /**
   * Cancel all pending requests
   */
  cancelAll: () => void;
}

/**
 * Hook for managing deal status updates with optimistic UI and race condition handling.
 *
 * Features:
 * - Optimistic UI updates: Status changes are reflected immediately
 * - Request cancellation: Rapid status changes cancel stale requests
 * - Rollback on failure: Failed updates revert to the previous status
 * - Request deduplication: Only the latest request for a deal is processed
 *
 * @example
 * ```tsx
 * const { updateStatus, isPending } = useDealStatusUpdate({
 *   onDealsUpdate: setDeals,
 *   onError: (dealId, error) => toast.error(`Failed to update deal: ${error.message}`),
 *   onSuccess: (dealId, status) => toast.success(`Deal updated to ${status}`)
 * });
 *
 * // In event handler
 * await updateStatus(deal.id, 'active', deal.status);
 * ```
 */
export function useDealStatusUpdate({
  onDealsUpdate,
  onError,
  onSuccess,
}: UseDealStatusUpdateOptions): UseDealStatusUpdateReturn {
  const requestIdRef = useRef(0);
  const [state, setState] = useState<StatusUpdateState>({
    pendingDeals: new Map(),
    optimisticStatuses: new Map(),
  });

  const updateStatus = useCallback(
    async (dealId: string, newStatus: DealStatus, currentStatus: DealStatus): Promise<void> => {
      // Generate a unique request ID for this update
      const requestId = ++requestIdRef.current;

      // Cancel any existing request for this deal
      const existingRequest = state.pendingDeals.get(dealId);
      if (existingRequest) {
        existingRequest.abortController.abort();
      }

      // Create a new abort controller for this request
      const abortController = new AbortController();

      // Track this as a pending request
      const pendingRequest: PendingRequest = {
        abortController,
        requestId,
        previousStatus: currentStatus,
      };

      setState((prev) => {
        const newPendingDeals = new Map(prev.pendingDeals);
        newPendingDeals.set(dealId, pendingRequest);

        const newOptimisticStatuses = new Map(prev.optimisticStatuses);
        newOptimisticStatuses.set(dealId, newStatus);

        return {
          pendingDeals: newPendingDeals,
          optimisticStatuses: newOptimisticStatuses,
        };
      });

      // Apply optimistic update immediately
      onDealsUpdate((deals) =>
        deals.map((deal) =>
          deal.id === dealId ? { ...deal, status: newStatus } : deal
        )
      );

      try {
        // Make the API request
        const response = await fetch(`/api/deals/${dealId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ status: newStatus }),
          signal: abortController.signal,
        });

        // Check if this request is still the latest for this deal
        const currentPendingRequest = state.pendingDeals.get(dealId);
        if (currentPendingRequest?.requestId !== requestId) {
          // A newer request has been made, ignore this response
          return;
        }

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error?.message || `HTTP ${response.status}`);
        }

        // Success - clear pending state but keep the optimistic status
        setState((prev) => {
          const newPendingDeals = new Map(prev.pendingDeals);
          newPendingDeals.delete(dealId);

          const newOptimisticStatuses = new Map(prev.optimisticStatuses);
          newOptimisticStatuses.delete(dealId);

          return {
            pendingDeals: newPendingDeals,
            optimisticStatuses: newOptimisticStatuses,
          };
        });

        onSuccess?.(dealId, newStatus);
      } catch (error) {
        // Check if this was an abort (not a real error)
        if (error instanceof Error && error.name === 'AbortError') {
          // Request was cancelled, don't rollback - a newer request will handle the state
          return;
        }

        // Check if this request is still the latest for this deal
        const currentPendingRequest = state.pendingDeals.get(dealId);
        if (currentPendingRequest?.requestId !== requestId) {
          // A newer request has been made, let it handle the state
          return;
        }

        // Rollback the optimistic update
        onDealsUpdate((deals) =>
          deals.map((deal) =>
            deal.id === dealId ? { ...deal, status: currentStatus } : deal
          )
        );

        // Clear pending state
        setState((prev) => {
          const newPendingDeals = new Map(prev.pendingDeals);
          newPendingDeals.delete(dealId);

          const newOptimisticStatuses = new Map(prev.optimisticStatuses);
          newOptimisticStatuses.delete(dealId);

          return {
            pendingDeals: newPendingDeals,
            optimisticStatuses: newOptimisticStatuses,
          };
        });

        onError?.(
          dealId,
          error instanceof Error ? error : new Error('Unknown error'),
          currentStatus
        );
      }
    },
    [onDealsUpdate, onError, onSuccess, state.pendingDeals]
  );

  const isPending = useCallback(
    (dealId: string): boolean => {
      return state.pendingDeals.has(dealId);
    },
    [state.pendingDeals]
  );

  const getOptimisticStatus = useCallback(
    (dealId: string): DealStatus | undefined => {
      return state.optimisticStatuses.get(dealId);
    },
    [state.optimisticStatuses]
  );

  const cancelAll = useCallback(() => {
    state.pendingDeals.forEach((request) => {
      request.abortController.abort();
    });

    setState({
      pendingDeals: new Map(),
      optimisticStatuses: new Map(),
    });
  }, [state.pendingDeals]);

  return {
    updateStatus,
    isPending,
    getOptimisticStatus,
    cancelAll,
  };
}
