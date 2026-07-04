import type { Activity } from '@/features/timeline/hooks/useTodayActivities';

// data-model.md: the six states the widget can ever be in — no unhandled
// fallthrough that could render a blank/broken widget (FR-005/FR-006/FR-007).
export type WidgetState =
  | { kind: 'signed_out' }
  | { kind: 'empty' }
  | { kind: 'current_and_next'; current: Activity; next: Activity }
  | { kind: 'current_only'; current: Activity }
  | { kind: 'next_only'; next: Activity }
  | { kind: 'nothing_left' };

export function toWidgetState(params: {
  hasSession: boolean;
  hasAnyActivitiesToday: boolean;
  current: Activity | null;
  next: Activity | null;
}): WidgetState {
  if (!params.hasSession) return { kind: 'signed_out' };
  if (!params.hasAnyActivitiesToday) return { kind: 'empty' };
  if (params.current && params.next) {
    return { kind: 'current_and_next', current: params.current, next: params.next };
  }
  if (params.current) return { kind: 'current_only', current: params.current };
  if (params.next) return { kind: 'next_only', next: params.next };
  return { kind: 'nothing_left' };
}
