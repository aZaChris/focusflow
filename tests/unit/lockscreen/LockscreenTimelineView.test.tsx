import { render } from '@testing-library/react-native';
import { LockscreenTimelineView } from '@/features/lockscreen/LockscreenTimelineView';
import type { Activity } from '@/features/timeline/hooks/useTodayActivities';

function activity(overrides: Partial<Activity>): Activity {
  return {
    id: overrides.id ?? 'a',
    title: 'Something',
    activity_date: '2026-07-11',
    start_time: '09:00',
    end_time: '10:00',
    ...overrides,
  };
}

describe('LockscreenTimelineView', () => {
  it('renders a single info block when signed out', async () => {
    const { getByText } = await render(<LockscreenTimelineView state={{ kind: 'signed_out' }} />);
    expect(getByText('Sign in to see your schedule')).toBeTruthy();
  });

  it('renders a single info block when empty', async () => {
    const { getByText } = await render(<LockscreenTimelineView state={{ kind: 'empty' }} />);
    expect(getByText('Nothing scheduled today')).toBeTruthy();
  });

  it('renders the current activity centered and the next as a following block', async () => {
    const current = activity({ id: 'a', title: 'Shower' });
    const next = activity({ id: 'b', title: 'Breakfast' });
    const { getByText } = await render(<LockscreenTimelineView state={{ kind: 'current_and_next', current, next }} />);
    expect(getByText('Shower')).toBeTruthy();
    expect(getByText('Breakfast')).toBeTruthy();
  });

  it('renders the current activity plus "nothing else today" for current_only', async () => {
    const current = activity({ id: 'a', title: 'Shower' });
    const { getByText } = await render(<LockscreenTimelineView state={{ kind: 'current_only', current }} />);
    expect(getByText('Shower')).toBeTruthy();
    expect(getByText('Nothing else today')).toBeTruthy();
  });

  it('renders "nothing right now" plus the next activity for next_only', async () => {
    const next = activity({ id: 'b', title: 'Breakfast' });
    const { getByText } = await render(<LockscreenTimelineView state={{ kind: 'next_only', next }} />);
    expect(getByText('Nothing right now')).toBeTruthy();
    expect(getByText('Breakfast')).toBeTruthy();
  });

  it('renders a single info block for nothing_left', async () => {
    const { getByText } = await render(<LockscreenTimelineView state={{ kind: 'nothing_left' }} />);
    expect(getByText('Nothing scheduled right now')).toBeTruthy();
  });
});
