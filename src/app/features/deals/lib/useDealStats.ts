/**
 * React hooks for deal status computations
 */

import { useMemo } from 'react';
import type { Deal } from './types';

/**
 * Compute status counts from deals
 */
export function useStatusCounts(deals: Deal[]) {
  return useMemo(
    () => ({
      all: deals.length,
      draft: deals.filter((d) => d.status === 'draft').length,
      active: deals.filter((d) => d.status === 'active').length,
      paused: deals.filter((d) => d.status === 'paused').length,
      agreed: deals.filter((d) => d.status === 'agreed').length,
      closed: deals.filter((d) => d.status === 'closed').length,
    }),
    [deals]
  );
}
