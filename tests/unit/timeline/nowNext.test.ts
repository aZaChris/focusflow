import { getNowAndNext } from '@/features/timeline/nowNext';
import type { Activity } from '@/features/timeline/hooks/useTodayActivities';

function activity(overrides: Partial<Activity>): Activity {
  return {
    id: overrides.id ?? Math.random().toString(36),
    title: 'Untitled',
    activity_date: '2026-07-04',
    start_time: '09:00',
    end_time: '10:00',
    ...overrides,
  };
}

describe('getNowAndNext', () => {
  it('finds the activity in progress as current', () => {
    const standup = activity({ id: 'a', title: 'Standup', start_time: '09:00', end_time: '09:30' });
    const focus = activity({ id: 'b', title: 'Deep work', start_time: '10:00', end_time: '12:00' });
    const { current, next } = getNowAndNext([standup, focus], '09:15');
    expect(current?.id).toBe('a');
    expect(next?.id).toBe('b');
  });

  it('finds the soonest upcoming activity as next when nothing is current', () => {
    const later = activity({ id: 'a', title: 'Later', start_time: '14:00', end_time: '15:00' });
    const soonest = activity({ id: 'b', title: 'Soonest', start_time: '11:00', end_time: '12:00' });
    const { current, next } = getNowAndNext([later, soonest], '10:00');
    expect(current).toBeNull();
    expect(next?.id).toBe('b');
  });

  it('returns nulls for both when there is nothing left today', () => {
    const past = activity({ id: 'a', start_time: '08:00', end_time: '09:00' });
    const { current, next } = getNowAndNext([past], '20:00');
    expect(current).toBeNull();
    expect(next).toBeNull();
  });

  it('returns nulls for an empty activity list', () => {
    const { current, next } = getNowAndNext([], '09:00');
    expect(current).toBeNull();
    expect(next).toBeNull();
  });
});
