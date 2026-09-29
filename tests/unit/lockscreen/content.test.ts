import { buildLockscreenContent } from '@/features/lockscreen/content';
import type { Activity } from '@/features/timeline/hooks/useTodayActivities';
import type { WidgetState } from '@/features/widget/widgetState';

function activity(overrides: Partial<Activity>): Activity {
  return {
    id: overrides.id ?? 'a',
    title: 'Deep work',
    activity_date: '2026-09-18',
    start_time: '09:00',
    end_time: '10:00',
    ...overrides,
  };
}

describe('buildLockscreenContent', () => {
  it('renders every WidgetState.kind with non-empty text (no blank notification)', () => {
    const current = activity({ id: 'a', start_time: '09:00', end_time: '10:00' });
    const next = activity({ id: 'b', title: 'Standup', start_time: '11:00', end_time: '11:15' });

    const cases: [WidgetState, string][] = [
      [{ kind: 'signed_out' }, '09:30'],
      [{ kind: 'empty' }, '09:30'],
      [{ kind: 'nothing_left' }, '09:30'],
      [{ kind: 'current_only', current }, '09:30'],
      [{ kind: 'next_only', next }, '09:30'],
      [{ kind: 'current_and_next', current, next }, '09:30'],
    ];

    for (const [state, nowTime] of cases) {
      const content = buildLockscreenContent(state, nowTime);
      expect(content.title.length).toBeGreaterThan(0);
      expect(content.body.length).toBeGreaterThan(0);
      expect(content.bigText.length).toBeGreaterThan(0);
    }
  });

  it('the elapsed bar for the current activity fills proportionally to time passed', () => {
    const current = activity({ start_time: '09:00', end_time: '10:00' });

    const start = buildLockscreenContent({ kind: 'current_only', current }, '09:00');
    const half = buildLockscreenContent({ kind: 'current_only', current }, '09:30');
    const end = buildLockscreenContent({ kind: 'current_only', current }, '10:00');

    const filledCount = (text: string) => (text.match(/▓/g) ?? []).length;

    expect(filledCount(start.bigText)).toBe(0);
    expect(filledCount(half.bigText)).toBe(6); // half of a 12-char bar
    expect(filledCount(end.bigText)).toBe(12);
  });

  it('mentions both activities when current and next are both present', () => {
    const current = activity({ id: 'a', title: 'Deep work' });
    const next = activity({ id: 'b', title: 'Standup', start_time: '11:00', end_time: '11:15' });

    const content = buildLockscreenContent({ kind: 'current_and_next', current, next }, '09:30');

    expect(content.bigText).toContain('Deep work');
    expect(content.bigText).toContain('Standup');
  });
});
