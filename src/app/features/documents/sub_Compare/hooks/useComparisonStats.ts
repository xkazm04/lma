
import { useMemo } from 'react';
import type { ComparisonResult } from '@/types';

interface ComparisonStats {
    total: number;
    added: number;
    removed: number;
    modified: number;
}

const initialStats: ComparisonStats = {
    total: 0,
    added: 0,
    removed: 0,
    modified: 0,
};

export function useComparisonStats(result: ComparisonResult | null): ComparisonStats {
    return useMemo(() => {
        if (!result) return initialStats;

        return result.differences.reduce<ComparisonStats>((acc, category) => {
            // If differences is Array of objects with changes array (nested structure - legacy)
            if ('changes' in category && Array.isArray((category as any).changes)) {
                const changes = (category as any).changes;
                return changes.reduce((innerAcc: ComparisonStats, change: any) => {
                    innerAcc.total++;
                    if (change.changeType === 'added') innerAcc.added++;
                    else if (change.changeType === 'removed') innerAcc.removed++;
                    else if (change.changeType === 'modified') innerAcc.modified++;
                    return innerAcc;
                }, acc);
            } else {
                // Flattened structure (canonical)
                const diff = category as any;
                acc.total++;
                if (diff.changeType === 'added') acc.added++;
                else if (diff.changeType === 'removed') acc.removed++;
                else if (diff.changeType === 'modified') acc.modified++;
                return acc;
            }
        }, { ...initialStats });
    }, [result]);
}
