# View Transformers Pattern

## Overview

View transformers separate **data transformation** from **presentation**. This architectural pattern recognizes that different view modes (grid, list, kanban, timeline) are fundamentally different data structures, not just UI rendering choices.

## The Problem

Traditional approach:
```tsx
// ❌ View contains business logic
function KanbanView({ deals }: { deals: Deal[] }) {
  // Business logic mixed with presentation
  const columns = deals.reduce((acc, deal) => {
    acc[deal.status].push(deal);
    return acc;
  }, { draft: [], active: [], ... });

  return (
    <div>
      {Object.entries(columns).map(([status, deals]) => (
        <Column status={status} deals={deals} />
      ))}
    </div>
  );
}
```

**Problems:**
- Business logic (grouping) in presentation layer
- Hard to test without mounting components
- Logic duplicated across similar views
- Can't reuse transformations in other contexts

## The Solution

View Transformer pattern:
```tsx
// ✅ Separate transformation from presentation

// 1. Define data structure
export interface KanbanViewData {
  draft: Deal[];
  active: Deal[];
  paused: Deal[];
  agreed: Deal[];
  closed: Deal[];
}

// 2. Create transformer (pure function, testable)
export function transformToKanbanView(deals: Deal[]): KanbanViewData {
  const columns: KanbanViewData = {
    draft: [],
    active: [],
    paused: [],
    agreed: [],
    closed: [],
  };

  deals.forEach((deal) => {
    if (deal.status in columns) {
      columns[deal.status].push(deal);
    }
  });

  return columns;
}

// 3. Pure presentational component
function KanbanView({ data }: { data: KanbanViewData }) {
  return (
    <div>
      {Object.entries(data).map(([status, deals]) => (
        <Column status={status} deals={deals} />
      ))}
    </div>
  );
}

// 4. Parent orchestrates
function DealsPage() {
  const viewData = useMemo(() => ({
    kanban: transformToKanbanView(deals),
    timeline: transformToTimelineView(deals),
  }), [deals]);

  return <KanbanView data={viewData.kanban} />;
}
```

## Benefits

### 1. Views Have No Business Logic
Components become pure presenters:
```tsx
// Just renders pre-shaped data
function TimelineView({ data }: { data: TimelineViewData }) {
  return (
    <>
      <Timeline deals={data.dealsWithDates} />
      <UnscheduledDeals deals={data.dealsWithoutDates} />
    </>
  );
}
```

### 2. Independently Testable
Test transformations without React:
```typescript
describe('transformToKanbanView', () => {
  it('groups deals by status', () => {
    const deals = [
      { id: '1', status: 'draft' },
      { id: '2', status: 'active' },
    ];

    const result = transformToKanbanView(deals);

    expect(result.draft).toHaveLength(1);
    expect(result.active).toHaveLength(1);
  });
});
```

### 3. Easy to Add Views
New view = transformer + component:
```typescript
// New calendar view
export interface CalendarViewData {
  [month: string]: {
    [day: string]: Deal[];
  };
}

export function transformToCalendarView(deals: Deal[]): CalendarViewData {
  // Group by month, then by day
  return deals.reduce((acc, deal) => {
    const month = getMonth(deal.target_close_date);
    const day = getDay(deal.target_close_date);
    acc[month] = acc[month] || {};
    acc[month][day] = acc[month][day] || [];
    acc[month][day].push(deal);
    return acc;
  }, {});
}
```

### 4. Reusable Across Modules
Same pattern works everywhere:
```typescript
// Documents module
transformToDocumentKanbanView(documents); // Group by status
transformToDocumentTimelineView(documents); // Group by upload date

// Compliance module
transformToComplianceKanbanView(obligations); // Group by status
transformToComplianceTimelineView(obligations); // Group by deadline
```

## Data Structure Examples

### Grid/List View
```typescript
type GridViewData = Deal[]; // No transformation
```

### Kanban View
```typescript
interface KanbanViewData {
  [status: string]: Deal[];
}
// = groupBy(status)
```

### Timeline View
```typescript
interface TimelineViewData {
  dealsWithDates: Deal[];    // sorted by date
  dealsWithoutDates: Deal[]; // unsorted
}
// = sortBy(date) + partition(hasDate)
```

### Smart Inbox View
```typescript
interface InboxViewData {
  critical: PrioritizedDeal[];
  high: PrioritizedDeal[];
  medium: PrioritizedDeal[];
  low: PrioritizedDeal[];
}
// = groupBy(priority.level)
```

## Adding a New View

**Step 1:** Define the data structure
```typescript
export interface MyViewData {
  // What structure does the view need?
  groups: { label: string; items: Deal[] }[];
}
```

**Step 2:** Create transformer
```typescript
export function transformToMyView(deals: Deal[]): MyViewData {
  // Transform flat array to view structure
  return {
    groups: deals.reduce((acc, deal) => {
      // Your grouping logic
      return acc;
    }, []),
  };
}
```

**Step 3:** Build presentational component
```tsx
export function MyView({ data }: { data: MyViewData }) {
  return (
    <div>
      {data.groups.map(group => (
        <Group key={group.label} items={group.items} />
      ))}
    </div>
  );
}
```

**Step 4:** Add tests
```typescript
describe('transformToMyView', () => {
  it('transforms correctly', () => {
    const result = transformToMyView(mockDeals);
    expect(result.groups).toHaveLength(3);
  });
});
```

**Step 5:** Use in parent
```tsx
const viewData = useMemo(() => ({
  my: transformToMyView(deals),
}), [deals]);

<MyView data={viewData.my} />
```

## Migration Guide

**Before:**
```tsx
function MyView({ deals }: { deals: Deal[] }) {
  // Transform data inside component
  const transformed = useMemo(() => {
    return deals.filter(...).sort(...).reduce(...);
  }, [deals]);

  return <div>{/* render */}</div>;
}
```

**After:**
```tsx
// 1. Extract to transformer
function transformToMyView(deals: Deal[]) {
  return deals.filter(...).sort(...).reduce(...);
}

// 2. Component becomes pure
function MyView({ data }: { data: MyViewData }) {
  return <div>{/* render */}</div>;
}

// 3. Parent orchestrates
function Parent() {
  const data = useMemo(() => transformToMyView(deals), [deals]);
  return <MyView data={data} />;
}
```

## Best Practices

1. **One transformer per view** - Each view gets its own transformer
2. **Pure functions** - Transformers should have no side effects
3. **Type the output** - Define explicit data structure types
4. **Test transformers** - Unit test without mounting components
5. **Memoize in parent** - Use `useMemo` to cache transformations
6. **Keep views dumb** - Components only render, no logic

## Real-World Example

See `src/app/features/deals/lib/view-transformers.ts` for production implementation with:
- 5 different view transformers
- Comprehensive TypeScript types
- Full unit test coverage
- Usage in `DealsListPage.tsx`
