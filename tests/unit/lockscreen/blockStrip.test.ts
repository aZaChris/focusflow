import { getBlocks, formatBlockStrip } from '@/features/lockscreen/blockStrip';
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

describe('getBlocks', () => {
  it('is a single info block when signed out', () => {
    expect(getBlocks({ kind: 'signed_out' })).toEqual([{ kind: 'info', label: 'Sign in to see your schedule' }]);
  });

  it('is a single info block when empty', () => {
    expect(getBlocks({ kind: 'empty' })).toEqual([{ kind: 'info', label: 'Nothing scheduled today' }]);
  });

  it('is current then next, in order, for current_and_next', () => {
    const current = activity({ id: 'a', title: 'Shower' });
    const next = activity({ id: 'b', title: 'Breakfast' });
    expect(getBlocks({ kind: 'current_and_next', current, next })).toEqual([
      { kind: 'current', label: 'Shower' },
      { kind: 'next', label: 'Breakfast' },
    ]);
  });

  it('is current then an info block for current_only', () => {
    const current = activity({ id: 'a', title: 'Shower' });
    expect(getBlocks({ kind: 'current_only', current })).toEqual([
      { kind: 'current', label: 'Shower' },
      { kind: 'info', label: 'Nothing else today' },
    ]);
  });

  it('is an info block then next for next_only', () => {
    const next = activity({ id: 'b', title: 'Breakfast' });
    expect(getBlocks({ kind: 'next_only', next })).toEqual([
      { kind: 'info', label: 'Nothing right now' },
      { kind: 'next', label: 'Breakfast' },
    ]);
  });

  it('is a single info block for nothing_left', () => {
    expect(getBlocks({ kind: 'nothing_left' })).toEqual([{ kind: 'info', label: 'Nothing scheduled right now' }]);
  });
});

describe('formatBlockStrip', () => {
  it('labels the current block with "Now:" and the next block with "Next:"', () => {
    const current = activity({ id: 'a', title: 'Shower' });
    const next = activity({ id: 'b', title: 'Breakfast' });
    expect(formatBlockStrip({ kind: 'current_and_next', current, next })).toBe('▸ Now: Shower  →  Next: Breakfast');
  });

  it('renders info-only blocks as plain text', () => {
    expect(formatBlockStrip({ kind: 'signed_out' })).toBe('Sign in to see your schedule');
    expect(formatBlockStrip({ kind: 'nothing_left' })).toBe('Nothing scheduled right now');
  });

  it('mixes an info block with a next block', () => {
    const next = activity({ id: 'b', title: 'Breakfast' });
    expect(formatBlockStrip({ kind: 'next_only', next })).toBe('Nothing right now  →  Next: Breakfast');
  });
});
