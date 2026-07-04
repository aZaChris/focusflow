import { toWidgetState } from '@/features/widget/widgetState';
import type { Activity } from '@/features/timeline/hooks/useTodayActivities';

function activity(overrides: Partial<Activity>): Activity {
  return {
    id: overrides.id ?? 'a',
    title: 'Something',
    activity_date: '2026-07-04',
    start_time: '09:00',
    end_time: '10:00',
    ...overrides,
  };
}

describe('toWidgetState', () => {
  it('is signed_out when there is no session, regardless of activities', () => {
    const state = toWidgetState({ hasSession: false, hasAnyActivitiesToday: true, current: activity({}), next: null });
    expect(state.kind).toBe('signed_out');
  });

  it('is empty when signed in with no activities today', () => {
    const state = toWidgetState({ hasSession: true, hasAnyActivitiesToday: false, current: null, next: null });
    expect(state.kind).toBe('empty');
  });

  it('is current_and_next when both are present', () => {
    const current = activity({ id: 'a' });
    const next = activity({ id: 'b' });
    const state = toWidgetState({ hasSession: true, hasAnyActivitiesToday: true, current, next });
    expect(state).toEqual({ kind: 'current_and_next', current, next });
  });

  it('is current_only when nothing is next', () => {
    const current = activity({ id: 'a' });
    const state = toWidgetState({ hasSession: true, hasAnyActivitiesToday: true, current, next: null });
    expect(state).toEqual({ kind: 'current_only', current });
  });

  it('is next_only when nothing is current', () => {
    const next = activity({ id: 'b' });
    const state = toWidgetState({ hasSession: true, hasAnyActivitiesToday: true, current: null, next });
    expect(state).toEqual({ kind: 'next_only', next });
  });

  it('is nothing_left when signed in, has activities today, but none current or upcoming', () => {
    const state = toWidgetState({ hasSession: true, hasAnyActivitiesToday: true, current: null, next: null });
    expect(state.kind).toBe('nothing_left');
  });
});
