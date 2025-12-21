export type SortDirection = 'asc' | 'desc';

export type DealSortField =
  | 'deal_name'
  | 'status'
  | 'progress'
  | 'target_close_date'
  | 'created_at'
  | 'participant_count';

export interface SortConfig {
  field: DealSortField;
  direction: SortDirection;
}

export interface DealSortState {
  primary: SortConfig;
  secondary: SortConfig | null;
}

export const DEFAULT_SORT_STATE: DealSortState = {
  primary: { field: 'created_at', direction: 'desc' },
  secondary: null,
};

export const SORT_FIELD_LABELS: Record<DealSortField, string> = {
  deal_name: 'Name',
  status: 'Status',
  progress: 'Progress',
  target_close_date: 'Target Close',
  created_at: 'Created',
  participant_count: 'Participants',
};
