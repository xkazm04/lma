# Stats Provider Pattern

A cross-cutting concern pattern for computed entity statistics that eliminates scattered `useMemo` hooks and makes stats declarative, composable, cacheable, and testable.

## Problem

Stats are computed data derived from entities. Traditionally, this leads to:

1. **Scattered Logic**: `useMemo` hooks duplicated across components
2. **Poor Testability**: Inline calculations hard to unit test
3. **No Reusability**: Same stat computed differently in different places
4. **No Caching**: Each component recalculates independently
5. **Mixed Concerns**: Business logic mixed with presentation

**Before (Traditional Approach):**

```tsx
function DealCard({ deal, categories }) {
  // Scattered useMemo in every component
  const stats = useMemo(() => {
    const totalTerms = categories.flatMap(c => c.terms).length;
    const agreedTerms = categories
      .flatMap(c => c.terms)
      .filter(t => t.status === 'agreed').length;
    const progress = totalTerms > 0
      ? Math.round((agreedTerms / totalTerms) * 100)
      : 0;

    return { totalTerms, agreedTerms, progress };
  }, [categories]);

  return <div>Progress: {stats.progress}%</div>;
}
```

Problems:
- Logic duplicated across components
- Hard to test (inline in component)
- No caching across instances
- Difficult to maintain consistency

## Solution

The **StatsProvider Pattern** treats stats as first-class, declarative configurations:

**After (StatsProvider Pattern):**

```tsx
// 1. Define stats once (testable, reusable)
const dealStats = defineStats<Deal>([
  defineStat('total_terms', (deal, context) => {
    return context.categories.flatMap(c => c.terms).length;
  }),
  defineStat('agreed_terms', (deal, context) => {
    return context.categories
      .flatMap(c => c.terms)
      .filter(t => t.status === 'agreed').length;
  }),
  defineStat('progress', (deal, context) => {
    const total = context.categories.flatMap(c => c.terms).length;
    const agreed = context.categories
      .flatMap(c => c.terms)
      .filter(t => t.status === 'agreed').length;
    return total > 0 ? Math.round((agreed / total) * 100) : 0;
  }),
]);

// 2. Use in component (automatic memoization)
function DealCard({ deal, categories }) {
  const stats = useStats(deal, dealStats, { categories });
  return <div>Progress: {stats.progress}%</div>;
}
```

## Benefits

| Benefit | Description |
|---------|-------------|
| **Declarative** | Stats defined as configurations, not inline code |
| **Composable** | Combine multiple stat definitions with `composeStats()` |
| **Cacheable** | Provider-level caching with TTL and LRU eviction |
| **Testable** | Pure functions, easy to unit test |
| **Reusable** | Define once, use everywhere |
| **Type-Safe** | Full TypeScript inference |
| **Performant** | Automatic memoization, batch operations |

## Core API

### `defineStats()` - Define a collection of stats

```tsx
import { defineStats, defineStat } from '@/lib/utils';

const dealStats = defineStats<Deal>([
  defineStat('total_terms', (deal, context) => {
    return context.categories.length;
  }),
  defineStat('progress', (deal, context) => {
    // Compute progress percentage
    return 75;
  }),
]);
```

### `useStats()` - Use stats in React components

```tsx
function MyComponent({ deal, categories }) {
  const stats = useStats(deal, dealStats, { categories });

  return <div>{stats.total_terms} terms</div>;
}
```

### `useStatsBatch()` - Batch compute for arrays

```tsx
function DealsList({ deals, categories }) {
  const dealsWithStats = useStatsBatch(deals, dealStats, { categories });

  return dealsWithStats.map(deal => (
    <div key={deal.id}>{deal.stats.total_terms}</div>
  ));
}
```

### `composeStats()` - Combine definitions

```tsx
const basicStats = defineStats<Deal>([...]);
const advancedStats = defineStats<Deal>([...]);

// Compose into one
const allStats = composeStats(basicStats, advancedStats);
```

### `withStats()` - Pure function version

```tsx
const dealWithStats = withStats(deal, dealStats, context);
console.log(dealWithStats.stats.total_terms);
```

## Caching

Enable provider-level caching to avoid redundant computations:

```tsx
import { getStatsCache } from '@/lib/utils';

const cache = getStatsCache({
  maxSize: 1000,        // Max 1000 entries
  ttl: 5 * 60 * 1000,   // 5 minutes TTL
  trackStats: true      // Track hit/miss metrics
});

// Use cache
const stats = cache.get(deal.id, dealStats, () => {
  return withStats(deal, dealStats, context).stats;
});

// Check cache performance
console.log(cache.getHitRate()); // 0.85 (85% hit rate)
```

## Real-World Example: Deals Module

**Stats Definition** (`src/app/features/deals/lib/stats-definitions.ts`):

```tsx
export const basicDealStats = defineStats<Deal>([
  defineStat('total_terms', (deal, context) => {
    const categories = context?.categories as CategoryWithTerms[];
    return categories
      .filter(cat => cat.deal_id === deal.id)
      .reduce((sum, cat) => sum + cat.terms.length, 0);
  }),

  defineStat('agreed_terms', (deal, context) => {
    const categories = context?.categories as CategoryWithTerms[];
    return categories
      .filter(cat => cat.deal_id === deal.id)
      .flatMap(cat => cat.terms)
      .filter(term => term.negotiation_status === 'agreed').length;
  }),

  defineStat('participant_count', (deal, context) => {
    const participants = context?.participants;
    return participants.filter(
      p => p.deal_id === deal.id && p.status === 'active'
    ).length;
  }),
]);
```

**Usage in Component** (`src/app/features/deals/DealsListPage.tsx`):

```tsx
import { useStatusCounts } from './lib';

export function DealsListPage() {
  // Before: Inline useMemo
  // const statusCounts = useMemo(() => ({
  //   all: mockDeals.length,
  //   draft: mockDeals.filter(d => d.status === 'draft').length,
  //   ...
  // }), []);

  // After: Declarative pattern
  const statusCounts = useStatusCounts(mockDeals);

  return <DealStatsBar statusCounts={statusCounts} />;
}
```

## Testing

Stats definitions are pure functions, making them trivial to test:

```tsx
import { computeStats, basicDealStats } from './stats-definitions';

describe('Deal Stats', () => {
  it('computes total terms correctly', () => {
    const deal = { id: '1', deal_name: 'Test Deal' };
    const context = {
      categories: [
        { deal_id: '1', terms: [{}, {}, {}] }
      ]
    };

    const stats = computeStats(deal, basicDealStats, context);

    expect(stats.total_terms).toBe(3);
  });
});
```

## Migration Guide

### Step 1: Identify Stats Logic

Find all `useMemo` hooks computing stats:

```tsx
// ❌ Before
const progress = useMemo(() => {
  return Math.round((agreed / total) * 100);
}, [agreed, total]);
```

### Step 2: Create Stats Definition

Extract to a definition file:

```tsx
// ✅ After
export const progressStats = defineStats<Deal>([
  defineStat('progress', (deal, context) => {
    const { agreed, total } = context;
    return Math.round((agreed / total) * 100);
  }),
]);
```

### Step 3: Use Hook

Replace `useMemo` with `useStats`:

```tsx
// ❌ Before
const progress = useMemo(() => {
  return Math.round((agreed / total) * 100);
}, [agreed, total]);

// ✅ After
const stats = useStats(deal, progressStats, { agreed, total });
const progress = stats.progress;
```

## Best Practices

1. **Define stats in module-specific files**: `src/app/features/{module}/lib/stats-definitions.ts`
2. **Compose definitions**: Create basic, advanced, and complete variants
3. **Use context for dependencies**: Pass related data via context parameter
4. **Add formatters**: Include display formatters in stat definitions
5. **Enable caching for expensive stats**: Use StatsCache for complex calculations
6. **Test definitions**: Stats are pure functions - test them thoroughly

## File Structure

```
src/
├── lib/utils/
│   ├── stats-provider.ts       # Core pattern implementation
│   ├── stats-cache.ts          # Caching layer
│   └── stats-provider.example.ts  # Usage examples
└── app/features/deals/lib/
    ├── stats-definitions.ts    # Deal-specific stats
    └── useDealStats.ts         # Deal-specific hooks
```

## Inspiration

This pattern is inspired by:
- **Vue.js Computed Properties**: Declarative, reactive calculations
- **React Query**: Caching and automatic memoization
- **Redux Selectors**: Reusable, composable data derivation

## Next Steps

1. ✅ Implement core StatsProvider pattern
2. ✅ Create StatsCache for performance
3. ✅ Refactor deals module to use pattern
4. ⬜ Extend to documents module (`extraction_confidence`, `field_count`)
5. ⬜ Extend to compliance module (`obligation_count`, `breach_count`)
6. ⬜ Extend to ESG module (`kpi_progress`, `target_completion`)
7. ⬜ Add cache metrics dashboard
